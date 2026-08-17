export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createPool, resolveConnectionString } from '@/lib/db';
import { validatePlatformKey } from '@/lib/platform-access';

type PhoneCandidate = {
  user_id: string | null;
  auth_user_id: string | null;
  profile_phone: string | null;
  auth_phone: string | null;
  profile_metadata: any;
  profile_country_code: string | null;
};

type PhoneFix = {
  userId: string | null;
  fromProfile: string | null;
  fromAuth: string | null;
  normalized: string;
  actions: string[];
};

type PhoneConflict = {
  userId: string | null;
  profile: string | null;
  auth: string | null;
};

const DEFAULT_LIMIT = 20000;
const MAX_LIMIT = 100000;

function parseLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(parsed), MAX_LIMIT);
}

function normalizeIndianPhone(raw?: string | null) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || /^null$/i.test(trimmed)) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length >= 12 && digits.length <= 15 && digits.startsWith('91')) return `+${digits}`;

  return null;
}

function maskPhone(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const suffix = digits.slice(-4);
  return suffix ? `+***${suffix}` : null;
}

function phoneOwnerKey(userId?: string | null) {
  return userId || '__missing_user_id__';
}

function metadataCountryCode(metadata: any) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  return typeof metadata.country_code === 'string' ? metadata.country_code : null;
}

async function tableColumns(client: any, tableName: string) {
  const res = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1;
    `,
    [tableName]
  );
  return new Set<string>(res.rows.map((row: { column_name: string }) => row.column_name));
}

function hasPhoneProblem(phone?: string | null) {
  if (!phone || /^null$/i.test(String(phone).trim())) return false;
  return normalizeIndianPhone(phone) !== phone.trim();
}

async function authorizeMaintenance(req: NextRequest, database: string) {
  const configuredKey = process.env.PHONE_MAINTENANCE_KEY;
  const suppliedKey = req.headers.get('x-sge-maintenance-key');
  if (configuredKey && suppliedKey && suppliedKey === configuredKey) return { ok: true };

  const platformAuth = await validatePlatformKey(req, `${database}.admin`);
  if (platformAuth.ok) return { ok: true };

  return {
    ok: false,
    status: platformAuth.status || 401,
    error: 'A maintenance key or AMC MEP admin platform key is required.',
  };
}

async function normalizePhones(input: { dryRun: boolean; limit: number; database: string }) {
  const pool = createPool(resolveConnectionString(input.database));
  const client = await pool.connect();

  const summary = {
    dryRun: input.dryRun,
    scanned: 0,
    plannedChanges: 0,
    appliedChanges: 0,
    skippedConflicts: 0,
    skippedUnparseable: 0,
    samples: [] as PhoneFix[],
    conflicts: [] as PhoneConflict[],
  };

  try {
    const profileColumns = await tableColumns(client, 'user_profiles');
    const authColumns = await tableColumns(client, 'auth_accounts');
    if (!profileColumns.has('user_id') || !profileColumns.has('phone')) {
      throw new Error('user_profiles.user_id and user_profiles.phone are required for phone normalization.');
    }
    if (!authColumns.has('user_id') || !authColumns.has('phone')) {
      throw new Error('auth_accounts.user_id and auth_accounts.phone are required for phone normalization.');
    }

    const candidatesRes = await client.query<PhoneCandidate>(
      `
        SELECT COALESCE(u.user_id, a.user_id) AS user_id,
               a.user_id AS auth_user_id,
               u.phone AS profile_phone,
               a.phone AS auth_phone,
               ${profileColumns.has('metadata') ? 'u.metadata' : 'NULL'} AS profile_metadata,
               ${profileColumns.has('country_code') ? 'u.country_code' : 'NULL'} AS profile_country_code
        FROM user_profiles u
        FULL OUTER JOIN auth_accounts a ON a.user_id = u.user_id
        WHERE
          NULLIF(BTRIM(COALESCE(u.phone, '')), '') IS NOT NULL
          OR NULLIF(BTRIM(COALESCE(a.phone, '')), '') IS NOT NULL
        ORDER BY COALESCE(u.updated_at, a.updated_at, u.created_at, a.created_at) DESC NULLS LAST
        LIMIT $1;
      `,
      [input.limit]
    );

    const authPhonesRes = await client.query<{ user_id: string | null; phone: string | null }>(
      `
        SELECT user_id, phone
        FROM auth_accounts
        WHERE NULLIF(BTRIM(COALESCE(phone, '')), '') IS NOT NULL;
      `
    );
    const plannedAuthOwnersByPhone = new Map<string, Set<string>>();
    for (const account of authPhonesRes.rows) {
      const normalized = normalizeIndianPhone(account.phone);
      if (!normalized) continue;
      const owners = plannedAuthOwnersByPhone.get(normalized) || new Set<string>();
      owners.add(phoneOwnerKey(account.user_id));
      plannedAuthOwnersByPhone.set(normalized, owners);
    }

    summary.scanned = candidatesRes.rows.length;
    if (!input.dryRun) await client.query('BEGIN');

    for (const row of candidatesRes.rows) {
      const profileNormalized = normalizeIndianPhone(row.profile_phone);
      const authNormalized = normalizeIndianPhone(row.auth_phone);

      if (!profileNormalized && !authNormalized) {
        if (hasPhoneProblem(row.profile_phone) || hasPhoneProblem(row.auth_phone)) summary.skippedUnparseable += 1;
        continue;
      }

      if (profileNormalized && authNormalized && profileNormalized !== authNormalized) {
        summary.skippedConflicts += 1;
        if (summary.conflicts.length < 20) {
          summary.conflicts.push({ userId: row.user_id, profile: maskPhone(row.profile_phone), auth: maskPhone(row.auth_phone) });
        }
        continue;
      }

      const normalized = profileNormalized || authNormalized;
      if (!normalized) continue;

      const authOwners = plannedAuthOwnersByPhone.get(normalized) || new Set<string>();
      const conflictingAuthOwners = [...authOwners].filter((owner) => owner !== phoneOwnerKey(row.user_id));
      if (conflictingAuthOwners.length > 0) {
        summary.skippedConflicts += 1;
        if (summary.conflicts.length < 20) {
          summary.conflicts.push({ userId: row.user_id, profile: maskPhone(row.profile_phone), auth: maskPhone(row.auth_phone) });
        }
        continue;
      }

      const actions: string[] = [];
      const profileNeedsUpdate = row.profile_phone !== normalized;
      const authNeedsUpdate = row.auth_phone !== normalized;
      if (authNeedsUpdate && !row.auth_user_id) {
        summary.skippedConflicts += 1;
        if (summary.conflicts.length < 20) {
          summary.conflicts.push({ userId: row.user_id, profile: maskPhone(row.profile_phone), auth: null });
        }
        continue;
      }

      const metadataNeedsUpdate =
        profileColumns.has('metadata') &&
        normalized.startsWith('+91') &&
        metadataCountryCode(row.profile_metadata) !== '+91';
      const countryCodeNeedsUpdate =
        profileColumns.has('country_code') && normalized.startsWith('+91') && row.profile_country_code !== '+91';

      if (profileNeedsUpdate) actions.push('user_profiles.phone');
      if (authNeedsUpdate) actions.push('auth_accounts.phone');
      if (metadataNeedsUpdate) actions.push('user_profiles.metadata.country_code');
      if (countryCodeNeedsUpdate) actions.push('user_profiles.country_code');

      if (actions.length === 0) continue;
      summary.plannedChanges += actions.length;

      if (authNeedsUpdate) {
        const owners = plannedAuthOwnersByPhone.get(normalized) || new Set<string>();
        owners.add(phoneOwnerKey(row.user_id));
        plannedAuthOwnersByPhone.set(normalized, owners);
      }

      if (summary.samples.length < 25) {
        summary.samples.push({
          userId: row.user_id,
          fromProfile: maskPhone(row.profile_phone),
          fromAuth: maskPhone(row.auth_phone),
          normalized: maskPhone(normalized) || '+***',
          actions,
        });
      }

      if (input.dryRun || !row.user_id) continue;

      if (profileNeedsUpdate) {
        const updateParts = ['phone = $1'];
        if (profileColumns.has('updated_at')) updateParts.push('updated_at = now()');
        const updateRes = await client.query(`UPDATE user_profiles SET ${updateParts.join(', ')} WHERE user_id = $2;`, [
          normalized,
          row.user_id,
        ]);
        summary.appliedChanges += updateRes.rowCount || 0;
      }

      if (authNeedsUpdate) {
        const updateParts = ['phone = $1'];
        if (authColumns.has('updated_at')) updateParts.push('updated_at = now()');
        const updateRes = await client.query(`UPDATE auth_accounts SET ${updateParts.join(', ')} WHERE user_id = $2;`, [
          normalized,
          row.user_id,
        ]);
        summary.appliedChanges += updateRes.rowCount || 0;
      }

      if (metadataNeedsUpdate) {
        const updateParts = ["metadata = COALESCE(metadata, '{}'::jsonb) || '{\"country_code\":\"+91\"}'::jsonb"];
        if (profileColumns.has('updated_at')) updateParts.push('updated_at = now()');
        const updateRes = await client.query(`UPDATE user_profiles SET ${updateParts.join(', ')} WHERE user_id = $1;`, [row.user_id]);
        summary.appliedChanges += updateRes.rowCount || 0;
      }

      if (countryCodeNeedsUpdate) {
        const updateParts = ["country_code = '+91'"];
        if (profileColumns.has('updated_at')) updateParts.push('updated_at = now()');
        const updateRes = await client.query(`UPDATE user_profiles SET ${updateParts.join(', ')} WHERE user_id = $1;`, [row.user_id]);
        summary.appliedChanges += updateRes.rowCount || 0;
      }
    }

    if (!input.dryRun) await client.query('COMMIT');
    return summary;
  } catch (error) {
    if (!input.dryRun) await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const database = searchParams.get('database') || 'amcmep';
    const data = await normalizePhones({ dryRun: true, limit: parseLimit(searchParams.get('limit')), database });
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Phone audit failed.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;
    const database = body.database || 'amcmep';
    if (!dryRun) {
      const auth = await authorizeMaintenance(req, database);
      if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
    }

    const data = await normalizePhones({ dryRun, limit: parseLimit(body.limit), database });
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Phone normalization failed.' }, { status: 500 });
  }
}

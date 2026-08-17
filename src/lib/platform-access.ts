import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export const APP_TYPES = [
  'Next.js website',
  'React website',
  'Flutter Android app',
  'Flutter iOS app',
  'Web application',
  'React Native app',
  'Android native app',
  'iOS native app',
  'Server-side application',
] as const;

export const PLATFORM_SCOPES = [
  'amcmep.read',
  'amcmep.create',
  'amcmep.update',
  'amcmep.delete',
  'amcmep.schema',
  'amcmep.admin',
  'workofhuman.read',
  'workofhuman.create',
  'workofhuman.update',
  'workofhuman.delete',
  'workofhuman.schema',
  'workofhuman.admin',
  'control.read',
  'control.write',
  'control.admin',
] as const;

const CONTROL_DB_PRESET = 'sge_datahub';

export function controlConnectionString() {
  return resolveConnectionString(CONTROL_DB_PRESET);
}

function keyPepper() {
  const pepper = process.env.PLATFORM_KEY_PEPPER;
  if (!pepper || pepper.length < 24) {
    throw new Error('PLATFORM_KEY_PEPPER is not configured. Add it as a Cloudflare secret before creating or validating platform API keys.');
  }
  return pepper;
}

export function hashApiKey(apiKey: string) {
  return crypto.createHmac('sha256', keyPepper()).update(apiKey).digest('hex');
}

export function generateApiKey(projectKey: string, environment: string) {
  const prefix = environment === 'production' ? 'live' : environment || 'dev';
  const random = crypto.randomBytes(24).toString('base64url');
  return `SGE_${prefix}_${projectKey}_${random}`;
}

export function publicKeyPreview(apiKey: string) {
  const parts = apiKey.split('_');
  const random = parts.pop() || apiKey;
  return `${parts.join('_')}_${random.slice(0, 6)}...${random.slice(-4)}`;
}

export function requestIp(req: NextRequest) {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

export function requestOrigin(req: NextRequest) {
  return req.headers.get('origin') || req.headers.get('referer') || null;
}

export async function ensurePlatformSchema() {
  await runQuery(
    controlConnectionString(),
    `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS platform_users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'developer',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS platform_projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_key text NOT NULL UNIQUE,
        name text NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS platform_project_users (
        user_id uuid NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
        project_id uuid NOT NULL REFERENCES platform_projects(id) ON DELETE CASCADE,
        role text NOT NULL DEFAULT 'member',
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, project_id)
      );

      CREATE TABLE IF NOT EXISTS platform_databases (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES platform_projects(id) ON DELETE CASCADE,
        database_key text NOT NULL UNIQUE,
        name text NOT NULL,
        env_var_key text NOT NULL,
        badge text,
        color text,
        description text,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS platform_applications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_key text NOT NULL REFERENCES platform_projects(project_key) ON DELETE CASCADE,
        app_key text NOT NULL UNIQUE,
        name text NOT NULL,
        app_type text NOT NULL,
        environment text NOT NULL DEFAULT 'production',
        status text NOT NULL DEFAULT 'active',
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS platform_application_origins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id uuid NOT NULL REFERENCES platform_applications(id) ON DELETE CASCADE,
        origin text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (application_id, origin)
      );

      CREATE TABLE IF NOT EXISTS platform_application_identifiers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id uuid NOT NULL REFERENCES platform_applications(id) ON DELETE CASCADE,
        platform text NOT NULL,
        identifier text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (application_id, platform, identifier)
      );


      CREATE TABLE IF NOT EXISTS platform_audit_logs (
        id bigserial PRIMARY KEY,
        application_id uuid,
        api_key_id uuid,
        project_key text,
        action text NOT NULL,
        endpoint text,
        result text NOT NULL,
        ip_address text,
        origin text,
        user_agent text,
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `
  );
}

export async function ensureProjectApiKeysSchema(databaseKey: string) {
  const connectionString = resolveConnectionString(databaseKey);
  await runQuery(
    connectionString,
    `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS project_api_keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id uuid NOT NULL,
        key_prefix text NOT NULL,
        key_hash text NOT NULL UNIQUE,
        name text NOT NULL,
        environment text NOT NULL DEFAULT 'production',
        status text NOT NULL DEFAULT 'active',
        expires_at timestamptz,
        revoked_at timestamptz,
        last_used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS project_api_key_scopes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key_id uuid NOT NULL REFERENCES project_api_keys(id) ON DELETE CASCADE,
        scope text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (api_key_id, scope)
      );
    `
  );
}

export async function seedPlatformAccess() {
  await ensurePlatformSchema();
  await runQuery(
    controlConnectionString(),
    `
      INSERT INTO platform_projects (project_key, name, database_key)
      VALUES
        ('amcmep', 'AMC MEP App', 'amcmep'),
        ('workofhuman', 'WorkOfHuman App', 'workofhuman'),
        ('sge_datahub', 'SGE DataHub Control', 'sge_datahub')
      ON CONFLICT (project_key) DO UPDATE
        SET name = EXCLUDED.name, database_key = EXCLUDED.database_key, updated_at = now();

      WITH app_rows(project_key, app_key, name, app_type, environment, notes) AS (
        VALUES
          ('amcmep', 'amcmep_web', 'AMC MEP Web Domains', 'Next.js website', 'production', 'amcmep.in, www, app, and workspace domains'),
          ('amcmep', 'amcmep_android', 'AMC MEP Flutter Android', 'Flutter Android app', 'production', 'Package com.mepsge.amcsge'),
          ('amcmep', 'amcmep_ios', 'AMC MEP Flutter iOS', 'Flutter iOS app', 'production', 'Bundle com.mepsge.amcmep24x7one'),
          ('sge_datahub', 'sge_cloud_admin', 'SGE Cloud Admin Console', 'Web application', 'production', 'Open admin console for managing platform access')
      )
      INSERT INTO platform_applications (project_key, app_key, name, app_type, environment, notes)
      SELECT project_key, app_key, name, app_type, environment, notes FROM app_rows
      ON CONFLICT (app_key) DO UPDATE
        SET name = EXCLUDED.name,
            app_type = EXCLUDED.app_type,
            environment = EXCLUDED.environment,
            notes = EXCLUDED.notes,
            updated_at = now();

      INSERT INTO platform_application_origins (application_id, origin)
      SELECT a.id, origin
      FROM platform_applications a
      JOIN (VALUES
        ('amcmep_web', 'https://amcmep.in'),
        ('amcmep_web', 'https://www.amcmep.in'),
        ('amcmep_web', 'https://app.amcmep.in'),
        ('amcmep_web', 'https://workspace.amcmep.in'),
        ('sge_cloud_admin', 'https://cloud.sge.amcmep.in')
      ) AS origins(app_key, origin) ON origins.app_key = a.app_key
      ON CONFLICT DO NOTHING;

      INSERT INTO platform_application_identifiers (application_id, platform, identifier)
      SELECT a.id, platform, identifier
      FROM platform_applications a
      JOIN (VALUES
        ('amcmep_android', 'android_package', 'com.mepsge.amcsge'),
        ('amcmep_ios', 'ios_bundle', 'com.mepsge.amcmep24x7one')
      ) AS ids(app_key, platform, identifier) ON ids.app_key = a.app_key
      ON CONFLICT DO NOTHING;
    `
  );
}

export async function createPlatformApplication(input: {
  projectKey: string;
  name: string;
  appType: string;
  environment?: string;
  notes?: string;
  origins?: string[];
  identifiers?: { platform: string; identifier: string }[];
}) {
  await ensurePlatformSchema();
  const connectionString = controlConnectionString();
  const appKey = input.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + Math.random().toString(36).substring(2, 6);

  const res = await runQuery(
    connectionString,
    `INSERT INTO platform_applications (project_key, app_key, name, app_type, environment, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [input.projectKey, appKey, input.name, input.appType, input.environment || 'production', input.notes || '']
  );
  const appId = res.rows[0].id;

  if (input.origins && input.origins.length > 0) {
    for (const origin of input.origins) {
      if (origin.trim()) {
        await runQuery(connectionString, `INSERT INTO platform_application_origins (application_id, origin) VALUES ($1, $2)`, [appId, origin.trim()]);
      }
    }
  }

  if (input.identifiers && input.identifiers.length > 0) {
    for (const id of input.identifiers) {
      if (id.platform.trim() && id.identifier.trim()) {
        await runQuery(connectionString, `INSERT INTO platform_application_identifiers (application_id, platform, identifier) VALUES ($1, $2, $3)`, [appId, id.platform.trim(), id.identifier.trim()]);
      }
    }
  }

  return { id: appId, appKey };
}

export async function listPlatformAccess(userId: string, role: string, activeDatabaseKey: string | null) {
  await seedPlatformAccess();
  const connectionString = controlConnectionString();
  
  let projectsQuery = `SELECT * FROM platform_projects ORDER BY project_key;`;
  let appsQuery = `SELECT * FROM platform_applications ORDER BY project_key, app_key;`;
  let databasesQuery = `SELECT * FROM platform_databases ORDER BY name;`;
  let auditsQuery = `SELECT id, application_id, api_key_id, project_key, action, endpoint, result, ip_address, origin, created_at
                     FROM platform_audit_logs ORDER BY created_at DESC LIMIT 60;`;

  let queryParams: any[] = [];

  if (role !== 'admin') {
    projectsQuery = `
      SELECT p.* FROM platform_projects p
      INNER JOIN platform_project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = $1 ORDER BY p.project_key;
    `;
    appsQuery = `
      SELECT a.* FROM platform_applications a
      INNER JOIN platform_projects p ON a.project_key = p.project_key
      INNER JOIN platform_project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = $1 ORDER BY a.project_key, a.app_key;
    `;
    databasesQuery = `
      SELECT d.* FROM platform_databases d
      INNER JOIN platform_projects p ON d.project_id = p.id
      INNER JOIN platform_project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = $1 ORDER BY d.name;
    `;
    auditsQuery = `
      SELECT al.id, al.application_id, al.api_key_id, al.project_key, al.action, al.endpoint, al.result, al.ip_address, al.origin, al.created_at
      FROM platform_audit_logs al
      INNER JOIN platform_projects p ON al.project_key = p.project_key
      INNER JOIN platform_project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = $1 ORDER BY al.created_at DESC LIMIT 60;
    `;
    queryParams = [userId];
  }

  const [projects, applications, databases, origins, identifiers, audits] = await Promise.all([
    runQuery(connectionString, projectsQuery, queryParams),
    runQuery(connectionString, appsQuery, queryParams),
    runQuery(connectionString, databasesQuery, queryParams),
    runQuery(connectionString, `SELECT application_id, origin FROM platform_application_origins ORDER BY origin;`),
    runQuery(connectionString, `SELECT application_id, platform, identifier FROM platform_application_identifiers ORDER BY platform, identifier;`),
    runQuery(connectionString, auditsQuery, queryParams),
  ]);

  let keysRows: any[] = [];
  let scopesRows: any[] = [];
  let activeDatabaseTables: string[] = [];

  // Fetch API keys and tables from the selected database
  if (activeDatabaseKey) {
    // Verify the user actually has access to this database
    const db = databases.rows.find(d => d.database_key === activeDatabaseKey);
    if (db) {
      await ensureProjectApiKeysSchema(activeDatabaseKey);
      const dbConn = resolveConnectionString(activeDatabaseKey);
      
      const [dbKeys, dbScopes, dbTables] = await Promise.all([
        runQuery(dbConn, `SELECT id, application_id, key_prefix, name, environment, status, expires_at, revoked_at, last_used_at, created_at FROM project_api_keys ORDER BY created_at DESC;`),
        runQuery(dbConn, `SELECT api_key_id, scope FROM project_api_key_scopes ORDER BY scope;`),
        runQuery(dbConn, `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`)
      ]);
      
      keysRows = dbKeys.rows;
      scopesRows = dbScopes.rows;
      activeDatabaseTables = dbTables.rows.map(r => r.tablename);
    }
  }

  const scopesByKey = new Map<string, string[]>();
  scopesRows.forEach((row) => {
    const id = String(row.api_key_id);
    scopesByKey.set(id, [...(scopesByKey.get(id) || []), row.scope]);
  });

  const originsByApp = new Map<string, string[]>();
  origins.rows.forEach((row) => {
    const id = String(row.application_id);
    originsByApp.set(id, [...(originsByApp.get(id) || []), row.origin]);
  });

  const idsByApp = new Map<string, { platform: string; identifier: string }[]>();
  identifiers.rows.forEach((row) => {
    const id = String(row.application_id);
    idsByApp.set(id, [...(idsByApp.get(id) || []), { platform: row.platform, identifier: row.identifier }]);
  });

  const keysByApp = new Map<string, any[]>();
  keysRows.forEach((row) => {
    const appId = String(row.application_id);
    keysByApp.set(appId, [
      ...(keysByApp.get(appId) || []),
      {
        ...row,
        scopes: scopesByKey.get(String(row.id)) || [],
      },
    ]);
  });

  return {
    projects: projects.rows,
    databases: databases.rows,
    activeDatabaseTables,
    applications: applications.rows.map((app) => ({
      ...app,
      origins: originsByApp.get(String(app.id)) || [],
      identifiers: idsByApp.get(String(app.id)) || [],
      apiKeys: keysByApp.get(String(app.id)) || [],
    })),
    auditLogs: audits.rows,
    appTypes: APP_TYPES,
  };
}

export async function createApiKey(input: {
  applicationId: string;
  name: string;
  scopes: string[];
  environment?: string;
  expiresAt?: string | null;
  activeDatabaseKey: string;
}) {
  await ensureProjectApiKeysSchema(input.activeDatabaseKey);
  const connectionString = controlConnectionString();
  const dbConn = resolveConnectionString(input.activeDatabaseKey);

  const appRes = await runQuery(
    connectionString,
    `SELECT id, project_key, environment FROM platform_applications WHERE id = $1 AND status = 'active';`,
    [input.applicationId]
  );
  const app = appRes.rows[0];
  if (!app) throw new Error('Active application not found.');

  const scopes = input.scopes;
  if (scopes.length === 0) throw new Error('At least one valid scope is required.');

  const environment = input.environment || app.environment || 'production';
  // API key prefix is now SGE_live_<database_key>_xxxx
  const apiKey = generateApiKey(input.activeDatabaseKey, environment);
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = publicKeyPreview(apiKey);

  const keyRes = await runQuery(
    dbConn,
    `INSERT INTO project_api_keys (application_id, key_prefix, key_hash, name, environment, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, application_id, key_prefix, name, environment, status, expires_at, revoked_at, last_used_at, created_at;`,
    [input.applicationId, keyPrefix, keyHash, input.name, environment, input.expiresAt || null]
  );

  for (const scope of scopes) {
    await runQuery(
      dbConn,
      `INSERT INTO project_api_key_scopes (api_key_id, scope) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [keyRes.rows[0].id, scope]
    );
  }

  return { apiKey, record: { ...keyRes.rows[0], scopes } };
}

export async function revokeApiKey(keyId: string, activeDatabaseKey: string) {
  const dbConn = resolveConnectionString(activeDatabaseKey);
  const res = await runQuery(
    dbConn,
    `UPDATE project_api_keys
     SET status = 'revoked', revoked_at = COALESCE(revoked_at, now())
     WHERE id = $1
     RETURNING id;`,
    [keyId]
  );
  if (!res.rows[0]) throw new Error('API key not found.');
}

export async function validatePlatformKey(req: NextRequest, requiredScope: string) {
  await ensurePlatformSchema();
  const auth = req.headers.get('authorization') || '';
  const apiKey = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const controlDbString = controlConnectionString();

  if (!apiKey) {
    return { ok: false, status: 401, error: 'Missing API key.' };
  }

  // Key format: SGE_<environment>_<database_key>_<random>
  const parts = apiKey.split('_');
  const databaseKey = parts[2];
  if (!databaseKey) {
    return { ok: false, status: 401, error: 'Invalid API key format.' };
  }

  let keyHash: string;
  try {
    keyHash = hashApiKey(apiKey);
  } catch (error: any) {
    return { ok: false, status: 500, error: error.message };
  }

  const tenantDbString = resolveConnectionString(databaseKey);

  // Check key inside tenant database
  let keyRow;
  try {
    const keyRes = await runQuery(
      tenantDbString,
      `
        SELECT
          k.id AS key_id,
          k.application_id,
          k.status,
          k.expires_at,
          array_remove(array_agg(s.scope), NULL) AS scopes
        FROM project_api_keys k
        LEFT JOIN project_api_key_scopes s ON s.api_key_id = k.id
        WHERE k.key_hash = $1
        GROUP BY k.id;
      `,
      [keyHash]
    );
    keyRow = keyRes.rows[0];
  } catch (e: any) {
    return { ok: false, status: 500, error: 'Failed to access database.' };
  }

  if (!keyRow) {
    return { ok: false, status: 401, error: 'Invalid API key.' };
  }

  // Look up app details in sge_datahub
  const appRes = await runQuery(
    controlDbString,
    `SELECT app_key, project_key, status AS app_status FROM platform_applications WHERE id = $1`,
    [keyRow.application_id]
  );
  const appRow = appRes.rows[0];

  const scopes = keyRow.scopes || [];
  const adminScope = appRow?.project_key === CONTROL_DB_PRESET ? 'control.admin' : `${appRow?.project_key}.admin`;
  const hasScope = scopes.includes(requiredScope) || scopes.includes(adminScope) || scopes.includes('all');
  
  const result =
    !appRow ? 'denied_missing_app'
    : keyRow.status !== 'active' || appRow.app_status !== 'active' ? 'denied_inactive'
    : keyRow.expires_at && new Date(keyRow.expires_at).getTime() < Date.now() ? 'denied_expired'
    : !hasScope ? 'denied_scope'
    : 'allowed';

  await runQuery(
    controlDbString,
    `INSERT INTO platform_audit_logs (application_id, api_key_id, project_key, action, endpoint, result, ip_address, origin, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
    [
      keyRow.application_id || null,
      keyRow.key_id || null,
      appRow?.project_key || null,
      `authorize:${requiredScope}`,
      req.nextUrl.pathname,
      result,
      requestIp(req),
      requestOrigin(req),
      req.headers.get('user-agent'),
    ]
  );

  if (result !== 'allowed') {
    return { ok: false, status: result === 'denied_scope' ? 403 : 401, error: 'API key is not allowed for this request.' };
  }

  await runQuery(tenantDbString, `UPDATE project_api_keys SET last_used_at = now() WHERE id = $1;`, [keyRow.key_id]);

  return {
    ok: true,
    keyId: keyRow.key_id,
    applicationId: keyRow.application_id,
    appKey: appRow.app_key,
    projectKey: appRow.project_key,
    scopes,
  };
}

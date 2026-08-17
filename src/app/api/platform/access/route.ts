export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listPlatformAccess, revokeApiKey, seedPlatformAccess, createPlatformApplication } from '@/lib/platform-access';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const activeDatabase = req.nextUrl.searchParams.get('activeDatabase');
    const data = await listPlatformAccess(session.userId, session.role, activeDatabase);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load platform access.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (body.action === 'seed') {
      if (session.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      await seedPlatformAccess();
      return NextResponse.json({ success: true });
    }

    if (body.action === 'create_application') {
      const result = await createPlatformApplication({
        projectKey: body.projectKey,
        name: body.name,
        appType: body.appType,
        environment: body.environment,
        notes: body.notes,
        origins: body.origins,
        identifiers: body.identifiers,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'create_key') {
      const result = await createApiKey({
        applicationId: body.applicationId,
        name: body.name || 'Untitled key',
        scopes: Array.isArray(body.scopes) ? body.scopes : [],
        environment: body.environment,
        expiresAt: body.expiresAt || null,
        activeDatabaseKey: body.activeDatabaseKey,
      });
      return NextResponse.json({ success: true, apiKey: result.apiKey, record: result.record });
    }

    if (body.action === 'revoke_key') {
      await revokeApiKey(body.keyId, body.activeDatabaseKey);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unsupported platform access action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Platform access action failed.' }, { status: 400 });
  }
}

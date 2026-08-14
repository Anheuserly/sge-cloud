export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listPlatformAccess, revokeApiKey, seedPlatformAccess } from '@/lib/platform-access';

export async function GET() {
  try {
    const data = await listPlatformAccess();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load platform access.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'seed') {
      await seedPlatformAccess();
      return NextResponse.json({ success: true });
    }

    if (body.action === 'create_key') {
      const result = await createApiKey({
        applicationId: body.applicationId,
        name: body.name || 'Untitled key',
        scopes: Array.isArray(body.scopes) ? body.scopes : [],
        environment: body.environment,
        expiresAt: body.expiresAt || null,
      });
      return NextResponse.json({ success: true, apiKey: result.apiKey, record: result.record });
    }

    if (body.action === 'revoke_key') {
      await revokeApiKey(body.keyId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unsupported platform access action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Platform access action failed.' }, { status: 400 });
  }
}

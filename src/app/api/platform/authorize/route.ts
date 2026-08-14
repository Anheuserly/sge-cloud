export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validatePlatformKey } from '@/lib/platform-access';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scope = body.scope;
    if (!scope || typeof scope !== 'string') {
      return NextResponse.json({ success: false, error: 'Scope is required.' }, { status: 400 });
    }

    const result = await validatePlatformKey(req, scope);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      appKey: result.appKey,
      projectKey: result.projectKey,
      scopes: result.scopes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Authorization failed.' }, { status: 500 });
  }
}

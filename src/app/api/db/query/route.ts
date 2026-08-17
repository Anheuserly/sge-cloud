export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { validatePlatformKey } from '@/lib/platform-access';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql, preset } = body;

    if (!sql || typeof sql !== 'string' || sql.trim() === '') {
      return NextResponse.json({ success: false, error: 'SQL query string is required' }, { status: 400 });
    }

    // Security Check: Enforce API Key (admin/all scope) or UI Session
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const auth = await validatePlatformKey(req, 'admin'); // or 'all' will pass because validatePlatformKey checks for it
      if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }
    } else {
      const session = await verifySession(req);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const connectionString = resolveConnectionString(preset);
    const res = await runQuery(connectionString, sql);

    return NextResponse.json({
      success: true,
      rows: res.rows,
      rowCount: res.rowCount,
      fields: res.fields,
      durationMs: res.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'SQL query execution failed',
      },
      { status: 400 }
    );
  }
}

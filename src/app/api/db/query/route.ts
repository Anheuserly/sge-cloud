export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql, preset } = body;

    if (!sql || typeof sql !== 'string' || sql.trim() === '') {
      return NextResponse.json({ success: false, error: 'SQL query string is required' }, { status: 400 });
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

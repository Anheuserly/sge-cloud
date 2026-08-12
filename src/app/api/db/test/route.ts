import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const connectionString = resolveConnectionString(body.connectionUrl || body.preset);

    const res = await runQuery(
      connectionString,
      `SELECT current_database() as database_name, version() as pg_version, current_user as db_user;`
    );

    return NextResponse.json({
      success: true,
      data: res.rows[0],
      durationMs: res.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to database',
      },
      { status: 400 }
    );
  }
}

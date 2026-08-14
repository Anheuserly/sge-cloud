export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset');
    const customUrl = searchParams.get('url');
    const connectionString = resolveConnectionString(customUrl || preset);

    const query = `
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname;
    `;

    const res = await runQuery(connectionString, query);

    const databases = res.rows.map((row) => ({
      id: row.datname,
      name: row.datname,
    }));

    return NextResponse.json({
      success: true,
      databases,
      durationMs: res.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list databases',
      },
      { status: 500 }
    );
  }
}

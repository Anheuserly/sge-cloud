export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset');
    const customUrl = searchParams.get('url');
    const connectionString = resolveConnectionString(customUrl || preset);

    const tablesQuery = `
      SELECT 
        t.table_schema,
        t.table_name,
        t.table_type,
        COALESCE(c.column_count, 0) as column_count,
        COALESCE(s.n_live_tup, 0) as estimated_rows,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as total_size,
        pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as total_size_bytes
      FROM information_schema.tables t
      LEFT JOIN (
        SELECT table_schema, table_name, COUNT(*) as column_count
        FROM information_schema.columns
        GROUP BY table_schema, table_name
      ) c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      LEFT JOIN pg_stat_user_tables s ON t.table_schema = s.schemaname AND t.table_name = s.relname
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY t.table_schema, t.table_name;
    `;

    const res = await runQuery(connectionString, tablesQuery);

    return NextResponse.json({
      success: true,
      tables: res.rows,
      durationMs: res.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list database tables',
      },
      { status: 500 }
    );
  }
}

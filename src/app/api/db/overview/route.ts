export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset');
    const customUrl = searchParams.get('url');
    const connectionString = resolveConnectionString(customUrl || preset);

    // 1. Get database basic info & total size
    const dbInfoQuery = `
      SELECT 
        current_database() as database_name,
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_database_size(current_database()) as total_size_bytes,
        version() as version;
    `;

    // 2. Total tables count and total estimated rows
    const tablesSummaryQuery = `
      SELECT 
        COUNT(*) as total_tables,
        COALESCE(SUM(s.n_live_tup), 0) as total_estimated_rows
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON t.table_schema = s.schemaname AND t.table_name = s.relname
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema');
    `;

    // 3. Active connection count
    const connectionsQuery = `
      SELECT COUNT(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `;

    // 4. Top 5 largest tables
    const topTablesQuery = `
      SELECT 
        t.table_name,
        COALESCE(s.n_live_tup, 0) as row_count,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size,
        pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as size_bytes
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON t.table_schema = s.schemaname AND t.table_name = s.relname
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) DESC
      LIMIT 6;
    `;

    const [dbInfo, summary, conn, topTables] = await Promise.all([
      runQuery(connectionString, dbInfoQuery),
      runQuery(connectionString, tablesSummaryQuery),
      runQuery(connectionString, connectionsQuery),
      runQuery(connectionString, topTablesQuery),
    ]);

    return NextResponse.json({
      success: true,
      info: {
        databaseName: dbInfo.rows[0]?.database_name,
        totalSize: dbInfo.rows[0]?.total_size,
        totalSizeBytes: dbInfo.rows[0]?.total_size_bytes,
        version: dbInfo.rows[0]?.version,
        totalTables: parseInt(summary.rows[0]?.total_tables || '0', 10),
        totalEstimatedRows: parseInt(summary.rows[0]?.total_estimated_rows || '0', 10),
        activeConnections: parseInt(conn.rows[0]?.active_connections || '0', 10),
      },
      topTables: topTables.rows,
      durationMs: dbInfo.durationMs + summary.durationMs + conn.durationMs + topTables.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch database overview',
      },
      { status: 500 }
    );
  }
}

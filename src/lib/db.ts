import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DATABASE_PRESETS, resolveConnectionString } from '@/lib/constants';

export { DATABASE_PRESETS, resolveConnectionString };

export function createPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 3000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });

  return pool;
}

export interface QueryResponse<T = any> {
  rows: T[];
  rowCount: number | null;
  fields: { name: string; dataTypeId: number }[];
  durationMs: number;
}

export async function runQuery<T extends QueryResultRow = any>(
  connectionString: string,
  text: string,
  params: any[] = []
): Promise<QueryResponse<T>> {
  const pool = createPool(connectionString);
  const startTime = Date.now();

  try {
    const res: QueryResult<T> = await pool.query<T>(text, params);
    const durationMs = Date.now() - startTime;

    return {
      rows: res.rows,
      rowCount: res.rowCount,
      fields: (res.fields || []).map((f) => ({ name: f.name, dataTypeId: f.dataTypeID })),
      durationMs,
    };
  } finally {
    await pool.end();
  }
}

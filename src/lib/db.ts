import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DATABASE_PRESETS, resolveConnectionString } from '@/lib/constants';

export { DATABASE_PRESETS, resolveConnectionString };

// Global cache of connection pools to avoid reconnect overhead
const pools: Map<string, Pool> = new Map();

export function getPool(connectionString: string): Pool {
  let pool = pools.get(connectionString);
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    pools.set(connectionString, pool);
  }
  return pool;
}

export interface QueryResponse<T = any> {
  rows: T[];
  rowCount: number | null;
  fields: { name: string; dataTypeId: number }[];
  durationMs: number;
}

function getFallbackConnectionUrls(originalUrl: string): string[] {
  const fallbacks: string[] = [originalUrl];
  try {
    const parsed = new URL(originalUrl);
    const dbName = parsed.pathname.replace(/^\//, '') || 'sge_datahub';
    
    // Add localhost passwordless fallbacks for local dev
    const local1 = `postgresql://localhost:5432/${dbName}`;
    const local2 = `postgresql://localhost:5432/sge_datahub`;
    
    if (!fallbacks.includes(local1)) fallbacks.push(local1);
    if (!fallbacks.includes(local2)) fallbacks.push(local2);
  } catch (e) {
    // ignore parse error
  }
  return fallbacks;
}

export async function runQuery<T extends QueryResultRow = any>(
  connectionString: string,
  text: string,
  params: any[] = []
): Promise<QueryResponse<T>> {
  const urlsToTry = getFallbackConnectionUrls(connectionString);
  let lastError: any = null;

  for (const url of urlsToTry) {
    try {
      const pool = getPool(url);
      const startTime = Date.now();
      const res: QueryResult<T> = await pool.query<T>(text, params);
      const durationMs = Date.now() - startTime;

      return {
        rows: res.rows,
        rowCount: res.rowCount,
        fields: (res.fields || []).map((f) => ({ name: f.name, dataTypeId: f.dataTypeID })),
        durationMs,
      };
    } catch (err: any) {
      lastError = err;
      // If error is role/auth failure, continue to next fallback URL
    }
  }

  throw lastError || new Error('Failed to connect to PostgreSQL');
}

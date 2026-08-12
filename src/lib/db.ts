import { Pool, QueryResult } from 'pg';

// Global cache of connection pools to avoid reconnect overhead
const pools: Map<string, Pool> = new Map();

// Default preset databases based on sge-datahub architecture
export const DATABASE_PRESETS = [
  {
    id: 'amcmep',
    name: 'AMC MEP Product DB',
    url: process.env.AMCMEP_DATABASE_URL || 'postgresql://sge_datahub:change-me@localhost:5432/amcmep',
    description: 'AMC MEP businesses, memberships, listings, feeds, chat & requests',
    badge: 'Production',
    color: 'emerald',
  },
  {
    id: 'workofhuman',
    name: 'WorkOfHuman Product DB',
    url: process.env.WORKOFHUMAN_DATABASE_URL || 'postgresql://sge_datahub:change-me@localhost:5432/workofhuman',
    description: 'WorkOfHuman platform records, human profiles, conversations & listings',
    badge: 'Production',
    color: 'blue',
  },
  {
    id: 'sge_datahub',
    name: 'SGE DataHub Control DB',
    url: process.env.CONTROL_DATABASE_URL || 'postgresql://sge_datahub:change-me@localhost:5432/sge_datahub',
    description: 'Control-plane registry, Appwrite source archives & VPS sync nodes',
    badge: 'Control Plane',
    color: 'purple',
  },
];

export function resolveConnectionString(presetOrUrl?: string | null): string {
  if (!presetOrUrl) {
    return DATABASE_PRESETS[0].url;
  }
  const preset = DATABASE_PRESETS.find((p) => p.id === presetOrUrl);
  if (preset) {
    return preset.url;
  }
  return presetOrUrl;
}

export function getPool(connectionString: string): Pool {
  let pool = pools.get(connectionString);
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
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

export async function runQuery<T = any>(
  connectionString: string,
  text: string,
  params: any[] = []
): Promise<QueryResponse<T>> {
  const pool = getPool(connectionString);
  const startTime = Date.now();
  const res: QueryResult<T> = await pool.query(text, params);
  const durationMs = Date.now() - startTime;

  return {
    rows: res.rows,
    rowCount: res.rowCount,
    fields: (res.fields || []).map((f) => ({ name: f.name, dataTypeId: f.dataTypeID })),
    durationMs,
  };
}

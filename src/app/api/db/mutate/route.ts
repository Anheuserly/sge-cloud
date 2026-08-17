export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { validatePlatformKey } from '@/lib/platform-access';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, schema = 'public', table, data, where, preset } = body;

    if (!table || !action) {
      return NextResponse.json({ success: false, error: 'Table and action are required' }, { status: 400 });
    }

    // Security Check: Enforce API Key or UI Session
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const scopeAction = action === 'INSERT' ? 'create' : action === 'UPDATE' ? 'update' : 'delete';
      const auth = await validatePlatformKey(req, `${table}.${scopeAction}`);
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
    const safeTable = `"${schema}"."${table}"`;

    if (action === 'INSERT') {
      if (!data || typeof data !== 'object') {
        return NextResponse.json({ success: false, error: 'Data object is required for INSERT' }, { status: 400 });
      }

      const keys = Object.keys(data).filter((k) => data[k] !== undefined);
      if (keys.length === 0) {
        return NextResponse.json({ success: false, error: 'No fields provided for insertion' }, { status: 400 });
      }

      const columnsStr = keys.map((k) => `"${k.replace(/"/g, '')}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => {
        const val = data[k];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });

      const sql = `INSERT INTO ${safeTable} (${columnsStr}) VALUES (${placeholders}) RETURNING *;`;
      const res = await runQuery(connectionString, sql, values);

      return NextResponse.json({
        success: true,
        action: 'INSERT',
        record: res.rows[0],
        durationMs: res.durationMs,
      });
    }

    if (action === 'UPDATE') {
      if (!data || !where || typeof data !== 'object' || typeof where !== 'object') {
        return NextResponse.json({ success: false, error: 'Data and where objects are required for UPDATE' }, { status: 400 });
      }

      const updateKeys = Object.keys(data);
      const whereKeys = Object.keys(where);

      if (updateKeys.length === 0 || whereKeys.length === 0) {
        return NextResponse.json({ success: false, error: 'Empty update data or condition' }, { status: 400 });
      }

      const params: any[] = [];
      const setClauses = updateKeys.map((key) => {
        let val = data[key];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        params.push(val);
        return `"${key.replace(/"/g, '')}" = $${params.length}`;
      });

      const whereClauses = whereKeys.map((key) => {
        params.push(where[key]);
        return `"${key.replace(/"/g, '')}" = $${params.length}`;
      });

      const sql = `UPDATE ${safeTable} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *;`;
      const res = await runQuery(connectionString, sql, params);

      return NextResponse.json({
        success: true,
        action: 'UPDATE',
        updatedCount: res.rowCount,
        records: res.rows,
        durationMs: res.durationMs,
      });
    }

    if (action === 'DELETE') {
      if (!where || typeof where !== 'object') {
        return NextResponse.json({ success: false, error: 'Where condition object is required for DELETE' }, { status: 400 });
      }

      const whereKeys = Object.keys(where);
      if (whereKeys.length === 0) {
        return NextResponse.json({ success: false, error: 'Empty delete condition' }, { status: 400 });
      }

      const params: any[] = [];
      const whereClauses = whereKeys.map((key) => {
        params.push(where[key]);
        return `"${key.replace(/"/g, '')}" = $${params.length}`;
      });

      const sql = `DELETE FROM ${safeTable} WHERE ${whereClauses.join(' AND ')} RETURNING *;`;
      const res = await runQuery(connectionString, sql, params);

      return NextResponse.json({
        success: true,
        action: 'DELETE',
        deletedCount: res.rowCount,
        durationMs: res.durationMs,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Mutation failed',
      },
      { status: 500 }
    );
  }
}

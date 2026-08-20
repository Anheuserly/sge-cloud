export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { validatePlatformKey } from '@/lib/platform-access';

const DEFAULT_PAGE_SIZE = 50;
const ALLOWED_PAGE_SIZES = new Set([50, 100, 250, 500]);

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const schema = searchParams.get('schema') || 'public';
    const requestedPage = positiveInteger(searchParams.get('page'), 1);
    const requestedLimit = positiveInteger(searchParams.get('limit'), DEFAULT_PAGE_SIZE);
    const limit = ALLOWED_PAGE_SIZES.has(requestedLimit) ? requestedLimit : DEFAULT_PAGE_SIZE;
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';
    const search = searchParams.get('search');
    const preset = searchParams.get('preset');

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name is required' }, { status: 400 });
    }

    // Security Check: Enforce API Key or UI Session
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const auth = await validatePlatformKey(req, `${table}.read`);
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
    const safeTable = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

    // Load the real columns once. This both validates sorting and lets every
    // table choose a useful newest-first default without relying on one schema.
    const columnsQuery = `
      SELECT
        c.column_name,
        c.data_type,
        c.ordinal_position,
        EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.constraint_schema = kcu.constraint_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) AS is_primary_key
      FROM information_schema.columns c
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;
    const columnsRes = await runQuery(connectionString, columnsQuery, [schema, table]);
    if (columnsRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Table was not found' }, { status: 404 });
    }

    const columnNames = new Set(columnsRes.rows.map((column) => String(column.column_name)));
    const pkColumn = columnsRes.rows.find((column) => column.is_primary_key)?.column_name ?? null;
    const preferredDateNames = [
      'created_at',
      'createdat',
      'created_on',
      'createdon',
      'creation_date',
      'inserted_at',
      'added_at',
      'updated_at',
      'updatedat',
      'modified_at',
      'timestamp',
      'date',
    ];
    const newestColumn =
      preferredDateNames
        .map((name) => columnsRes.rows.find((column) => String(column.column_name).toLowerCase() === name))
        .find(Boolean)?.column_name ??
      columnsRes.rows.find((column) =>
        ['timestamp without time zone', 'timestamp with time zone', 'date'].includes(String(column.data_type))
      )?.column_name ??
      pkColumn;

    let orderClause = '';
    if (sortBy && columnNames.has(sortBy)) {
      orderClause = `ORDER BY ${quoteIdentifier(sortBy)} ${sortOrder} NULLS LAST`;
    } else if (newestColumn) {
      const tieBreaker = pkColumn && pkColumn !== newestColumn
        ? `, ${quoteIdentifier(pkColumn)} DESC NULLS LAST`
        : '';
      orderClause = `ORDER BY ${quoteIdentifier(String(newestColumn))} DESC NULLS LAST${tieBreaker}`;
    }

    // 2. Get columns to construct search clause if search is provided
    let whereClause = '';
    const queryParams: any[] = [];

    if (search && search.trim() !== '') {
      const searchableCols = columnsRes.rows
        .filter((column) => ['character varying', 'text', 'uuid'].includes(String(column.data_type)))
        .map((column) => String(column.column_name));

      if (searchableCols.length > 0) {
        const conditions = searchableCols.map((col, idx) => {
          queryParams.push(`%${search.trim()}%`);
          return `${quoteIdentifier(col)}::text ILIKE $${queryParams.length}`;
        });
        whereClause = `WHERE ${conditions.join(' OR ')}`;
      }
    }

    // 3. Count total matching rows
    const countSql = `SELECT COUNT(*) as total FROM ${safeTable} ${whereClause};`;
    const countRes = await runQuery(connectionString, countSql, queryParams);
    const totalRows = parseInt(countRes.rows[0]?.total || '0', 10);
    const totalPages = Math.max(1, Math.ceil(totalRows / limit));
    const page = Math.min(requestedPage, totalPages);

    // 4. Fetch page rows
    const offset = (page - 1) * limit;
    const dataSql = `SELECT * FROM ${safeTable} ${whereClause} ${orderClause} LIMIT ${limit} OFFSET ${offset};`;
    const dataRes = await runQuery(connectionString, dataSql, queryParams);

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages,
      },
      primaryKey: pkColumn,
      fields: dataRes.fields,
      durationMs: dataRes.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch table records',
      },
      { status: 500 }
    );
  }
}

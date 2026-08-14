export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const schema = searchParams.get('schema') || 'public';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';
    const search = searchParams.get('search');
    const preset = searchParams.get('preset');

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name is required' }, { status: 400 });
    }

    const connectionString = resolveConnectionString(preset);
    const safeTable = `"${schema}"."${table}"`;

    // 1. Get primary key or first column for default sorting
    const pkQuery = `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1 AND tc.table_name = $2
      LIMIT 1;
    `;
    const pkRes = await runQuery(connectionString, pkQuery, [schema, table]);
    const pkColumn = pkRes.rows.length > 0 ? pkRes.rows[0].column_name : null;

    let orderClause = '';
    if (sortBy) {
      orderClause = `ORDER BY "${sortBy.replace(/"/g, '')}" ${sortOrder}`;
    } else if (pkColumn) {
      orderClause = `ORDER BY "${pkColumn}" ASC`;
    }

    // 2. Get columns to construct search clause if search is provided
    let whereClause = '';
    const queryParams: any[] = [];

    if (search && search.trim() !== '') {
      const colsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2 AND data_type IN ('character varying', 'text', 'uuid');
      `;
      const colsRes = await runQuery(connectionString, colsQuery, [schema, table]);
      const searchableCols = colsRes.rows.map((c) => c.column_name);

      if (searchableCols.length > 0) {
        const conditions = searchableCols.map((col, idx) => {
          queryParams.push(`%${search.trim()}%`);
          return `"${col}"::text ILIKE $${queryParams.length}`;
        });
        whereClause = `WHERE ${conditions.join(' OR ')}`;
      }
    }

    // 3. Count total matching rows
    const countSql = `SELECT COUNT(*) as total FROM ${safeTable} ${whereClause};`;
    const countRes = await runQuery(connectionString, countSql, queryParams);
    const totalRows = parseInt(countRes.rows[0]?.total || '0', 10);

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
        totalPages: Math.ceil(totalRows / limit),
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

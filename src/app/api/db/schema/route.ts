export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const schema = searchParams.get('schema') || 'public';
    const preset = searchParams.get('preset');

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table parameter is required' }, { status: 400 });
    }

    const connectionString = resolveConnectionString(preset);

    // Fetch column definitions
    const columnsQuery = `
      SELECT 
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        tc.constraint_type
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_schema = kcu.table_schema 
        AND c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc 
        ON kcu.table_schema = tc.table_schema 
        AND kcu.table_name = tc.table_name 
        AND kcu.constraint_name = tc.constraint_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;

    // Fetch foreign key constraints
    const fksQuery = `
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2;
    `;

    // Fetch indexes
    const indexesQuery = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2;
    `;

    const [colsRes, fksRes, idxRes] = await Promise.all([
      runQuery(connectionString, columnsQuery, [schema, table]),
      runQuery(connectionString, fksQuery, [schema, table]),
      runQuery(connectionString, indexesQuery, [schema, table]),
    ]);

    // Map primary keys and foreign keys to column metadata
    const fkMap = new Map<string, { foreignTable: string; foreignColumn: string }>();
    fksRes.rows.forEach((fk) => {
      fkMap.set(fk.column_name, {
        foreignTable: fk.foreign_table_name,
        foreignColumn: fk.foreign_column_name,
      });
    });

    const columns = colsRes.rows.map((col) => {
      const isPk = col.constraint_type === 'PRIMARY KEY';
      const fk = fkMap.get(col.column_name);
      return {
        name: col.column_name,
        dataType: col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type,
        udtName: col.udt_name,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isPrimaryKey: isPk,
        foreignKey: fk || null,
      };
    });

    return NextResponse.json({
      success: true,
      tableName: table,
      schemaName: schema,
      columns,
      indexes: idxRes.rows,
      durationMs: colsRes.durationMs + fksRes.durationMs + idxRes.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch table schema',
      },
      { status: 500 }
    );
  }
}

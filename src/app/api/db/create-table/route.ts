import { NextResponse } from 'next/server';
import { runQuery, resolveConnectionString } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { presetId, tableName, columns } = await request.json();

    if (!presetId || !tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: presetId, tableName, and at least one column' },
        { status: 400 }
      );
    }

    // Basic SQL injection prevention for identifiers
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeTableName !== tableName) {
      return NextResponse.json({ error: 'Invalid table name. Use only alphanumeric characters and underscores.' }, { status: 400 });
    }

    let query = `CREATE TABLE "${safeTableName}" (\n`;
    
    const columnDefinitions = columns.map((col: any) => {
      const safeColName = col.name.replace(/[^a-zA-Z0-9_]/g, '');
      const safeType = col.type.replace(/[^a-zA-Z0-9_() ]/g, '');
      
      let def = `  "${safeColName}" ${safeType}`;
      if (col.isPrimaryKey) def += ' PRIMARY KEY';
      else if (!col.isNullable) def += ' NOT NULL';
      
      if (col.defaultValue !== undefined && col.defaultValue !== '') {
        // Safe injection for default is tricky, we'll allow basic expressions
        const safeDefault = col.defaultValue.replace(/'/g, "''");
        if (col.defaultValue.toUpperCase() === 'NOW()' || col.defaultValue.toUpperCase() === 'GEN_RANDOM_UUID()') {
          def += ` DEFAULT ${col.defaultValue}`;
        } else {
          def += ` DEFAULT '${safeDefault}'`;
        }
      }
      return def;
    });

    query += columnDefinitions.join(',\n');
    query += '\n);';

    const connectionString = resolveConnectionString(presetId);
    
    await runQuery(connectionString, query);

    return NextResponse.json({ success: true, message: `Table ${tableName} created successfully.` });
  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: error.message || 'Failed to create table' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { resolveConnectionString, runQuery } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, name, databaseKey, badge, color, description } = body;

    if (!projectId || !name || !databaseKey) {
      return NextResponse.json({ error: 'Project ID, database name, and database key are required.' }, { status: 400 });
    }
    
    if (!/^[a-z0-9_]+$/.test(databaseKey)) {
      return NextResponse.json({ error: 'Database key must contain only lowercase letters, numbers, and underscores.' }, { status: 400 });
    }

    const connStr = resolveConnectionString('sge_datahub');
    
    // 1. Verify user has admin access to this project
    const accessRes = await runQuery(
      connStr,
      `SELECT role FROM platform_project_users WHERE user_id = $1 AND project_id = $2`,
      [session.userId, projectId]
    );

    if (accessRes.rows.length === 0 || accessRes.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: You do not have admin access to this project.' }, { status: 403 });
    }

    // 2. Derive environment variable key (e.g. SGE_MYDB_DATABASE_URL)
    const envVarKey = `SGE_${databaseKey.toUpperCase()}_DATABASE_URL`;

    // 3. Register database
    try {
      const dbRes = await runQuery(
        connStr,
        `INSERT INTO platform_databases (project_id, database_key, name, env_var_key, badge, color, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [projectId, databaseKey, name, envVarKey, badge || null, color || null, description || null]
      );
      
      return NextResponse.json({ success: true, database: dbRes.rows[0] });
    } catch (e: any) {
      if (e.code === '23505') {
        return NextResponse.json({ error: 'A database with this key already exists.' }, { status: 409 });
      }
      throw e;
    }
  } catch (error: any) {
    console.error('Failed to create database:', error);
    return NextResponse.json({ error: 'Failed to create database.' }, { status: 500 });
  }
}

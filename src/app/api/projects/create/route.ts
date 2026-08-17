import { NextResponse } from 'next/server';
import { resolveConnectionString } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { Pool } from 'pg';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, projectKey } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    
    if (!projectKey || typeof projectKey !== 'string' || !/^[a-z0-9_]+$/.test(projectKey)) {
      return NextResponse.json({ error: 'Project key must contain only lowercase letters, numbers, and underscores.' }, { status: 400 });
    }

    const connStr = resolveConnectionString('sge_datahub');
    const pool = new Pool({ connectionString: connStr });
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create project
      const projRes = await client.query(
        `INSERT INTO platform_projects (project_key, name) 
         VALUES ($1, $2) 
         RETURNING id, project_key, name`,
        [projectKey, name]
      );
      const project = projRes.rows[0];

      // 2. Link user as admin
      await client.query(
        `INSERT INTO platform_project_users (user_id, project_id, role) 
         VALUES ($1, $2, 'admin')`,
        [session.userId, project.id]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true, project });
    } catch (e: any) {
      await client.query('ROLLBACK');
      if (e.code === '23505') {
        return NextResponse.json({ error: 'A project with this key already exists.' }, { status: 409 });
      }
      throw e;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { runQuery, controlConnectionString } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connStr = controlConnectionString();

    // If admin, they see all projects. If not, only their projects.
    let projectsQuery = `
      SELECT p.id, p.name, p.project_key
      FROM platform_projects p
      JOIN platform_project_users pu ON pu.project_id = p.id
      WHERE pu.user_id = $1 AND p.status = 'active'
    `;
    let queryParams = [session.userId];

    if (session.role === 'admin') {
      projectsQuery = `
        SELECT id, name, project_key
        FROM platform_projects
        WHERE status = 'active'
      `;
      queryParams = [];
    }

    const projectsRes = await runQuery(connStr, projectsQuery, queryParams);
    
    if (projectsRes.rows.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const projectIds = projectsRes.rows.map((p: any) => p.id);

    // Fetch databases for these projects
    const placeholders = projectIds.map((_: any, i: number) => `$${i + 1}`).join(',');
    const dbsRes = await runQuery(
      connStr,
      `SELECT id, project_id, database_key, name, env_var_key, badge, color, description
       FROM platform_databases
       WHERE project_id IN (${placeholders}) AND status = 'active'`,
      projectIds
    );

    const databasesByProject = dbsRes.rows.reduce((acc: any, db: any) => {
      if (!acc[db.project_id]) acc[db.project_id] = [];
      // Verify the env var exists
      const envVarValue = process.env[db.env_var_key];
      const isConfigured = Boolean(envVarValue && envVarValue.length > 5);
      
      acc[db.project_id].push({
        id: db.database_key,
        name: db.name,
        envVars: [db.env_var_key],
        description: db.description,
        badge: db.badge,
        color: db.color,
        isConfigured
      });
      return acc;
    }, {});

    const projects = projectsRes.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      key: p.project_key,
      databases: databasesByProject[p.id] || []
    }));

    return NextResponse.json({ projects, user: { email: session.email, role: session.role } });
  } catch (error: any) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

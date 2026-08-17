export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { runQuery, controlConnectionString } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    const connStr = controlConnectionString();

    // Fetch projects for the user
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
    const projectIds = projectsRes.rows.map((p: any) => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({ success: true, presets: [], hasConfiguredDatabase: false });
    }

    const placeholders = projectIds.map((_: any, i: number) => `$${i + 1}`).join(',');
    const dbsRes = await runQuery(
      connStr,
      `SELECT pd.id, pd.project_id, pd.database_key, pd.name, pd.env_var_key, pd.badge, pd.color, pd.description, pp.name as project_name
       FROM platform_databases pd
       JOIN platform_projects pp ON pp.id = pd.project_id
       WHERE pd.project_id IN (${placeholders}) AND pd.status = 'active'`,
      projectIds
    );

    const presets = dbsRes.rows.map((db: any) => ({
      id: db.database_key,
      name: `${db.project_name} - ${db.name}`, // Combining project name with db name to show hierarchy easily
      description: db.description,
      badge: db.badge,
      color: db.color,
    }));

    return NextResponse.json({
      success: true,
      presets,
      hasConfiguredDatabase: presets.length > 0,
      user: {
        email: session.email,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Config fetch error', error);
    return NextResponse.json({ success: false, presets: [] });
  }
}

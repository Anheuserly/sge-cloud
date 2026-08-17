import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/db';
import { ensurePlatformSchema, controlConnectionString } from '@/lib/platform-access';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return NextResponse.json({ error: 'Seed route disabled in production' }, { status: 403 });
    }

    // Ensure tables exist
    await ensurePlatformSchema();

    const connStr = controlConnectionString();

    // 1. Create Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userRes = await runQuery(
      connStr,
      `INSERT INTO platform_users (email, password_hash, role) 
       VALUES ($1, $2, 'admin') 
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash 
       RETURNING id`,
      ['admin@sge.amcmep.in', passwordHash]
    );
    const userId = userRes.rows[0].id;

    // 2. Create Project
    const projectRes = await runQuery(
      connStr,
      `INSERT INTO platform_projects (project_key, name) 
       VALUES ($1, $2) 
       ON CONFLICT (project_key) DO UPDATE SET name = EXCLUDED.name 
       RETURNING id`,
      ['SGE', 'SHREE GANESH ENTERPRISES']
    );
    const projectId = projectRes.rows[0].id;

    // 3. Map User to Project
    await runQuery(
      connStr,
      `INSERT INTO platform_project_users (user_id, project_id, role) 
       VALUES ($1, $2, 'admin') 
       ON CONFLICT DO NOTHING`,
      [userId, projectId]
    );

    // 4. Create Databases under Project
    const databases = [
      {
        key: 'amcmep',
        name: 'AMC MEP App DB',
        envKey: 'SGE_AMCMEP_DATABASE_URL',
        badge: 'AMC MEP App',
        color: 'emerald',
        desc: 'AMC MEP App Database (businesses, memberships, listings, chat & requests)'
      },
      {
        key: 'workofhuman',
        name: 'WorkOfHuman App DB',
        envKey: 'SGE_WORKOFHUMAN_DATABASE_URL',
        badge: 'WorkOfHuman App',
        color: 'blue',
        desc: 'WorkOfHuman App Database (empty schema for custom WorkOfHuman models)'
      },
      {
        key: 'sge_datahub',
        name: 'SGE DataHub Control DB',
        envKey: 'SGE_CONTROL_DATABASE_URL',
        badge: 'Control Plane',
        color: 'purple',
        desc: 'SGE DataHub general control database (infrastructure nodes and project registry only)'
      }
    ];

    for (const db of databases) {
      await runQuery(
        connStr,
        `INSERT INTO platform_databases (project_id, database_key, name, env_var_key, badge, color, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (database_key) DO UPDATE SET 
           name = EXCLUDED.name, 
           env_var_key = EXCLUDED.env_var_key,
           badge = EXCLUDED.badge,
           color = EXCLUDED.color,
           description = EXCLUDED.description`,
        [projectId, db.key, db.name, db.envKey, db.badge, db.color, db.desc]
      );
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully', userId, projectId });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

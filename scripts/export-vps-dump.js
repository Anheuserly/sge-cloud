const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function exportVpsSql() {
  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });
  const sqlFile = path.join(__dirname, '../data/amcmep_vps_sync_2026-08-14.sql');

  let sql = `-- AMCMEP DATABASE VPS RECOVERY & SYNC DUMP
-- Generated on 2026-08-14

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PAYMENT CONFIGS TABLE
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  upi_id VARCHAR(255),
  account_holder VARCHAR(255),
  account_number TEXT,
  ifsc VARCHAR(50),
  bank_name VARCHAR(255),
  qr_object_key TEXT,
  project_key TEXT,
  owner_type VARCHAR(100),
  owner_id TEXT,
  display_name VARCHAR(255)
);

`;

  // Dump payment_configs rows
  const payRes = await pool.query(`SELECT * FROM payment_configs;`);
  for (const r of payRes.rows) {
    sql += `INSERT INTO payment_configs (id, project_key, owner_type, owner_id, display_name, upi_id, account_holder, account_number, ifsc, bank_name, qr_object_key, active, metadata, created_at, updated_at) VALUES (\n`;
    sql += `  '${r.id}', '${r.project_key || 'amcmep'}', '${r.owner_type || 'platform'}', '${r.owner_id || 'official'}', '${(r.display_name || '').replace(/'/g, "''")}', '${r.upi_id || ''}', '${(r.account_holder || '').replace(/'/g, "''")}', '${r.account_number || ''}', '${r.ifsc || ''}', ${r.bank_name ? `'${r.bank_name}'` : 'NULL'}, ${r.qr_object_key ? `'${r.qr_object_key}'` : 'NULL'}, ${r.active}, '${JSON.stringify(r.metadata).replace(/'/g, "''")}', '${r.created_at.toISOString()}', '${r.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET active = EXCLUDED.active, metadata = EXCLUDED.metadata;\n\n`;
  }

  // Dump businesses rows
  sql += `-- 2. BUSINESSES TABLE\n`;
  const bizRes = await pool.query(`SELECT * FROM businesses;`);
  for (const b of bizRes.rows) {
    sql += `INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (\n`;
    sql += `  '${b.id}', '${(b.name || '').replace(/'/g, "''")}', '${b.kind || 'vendor'}', '${(b.location || '').replace(/'/g, "''")}', '${JSON.stringify(b.metadata).replace(/'/g, "''")}', '${b.created_at.toISOString()}', '${b.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  // Dump user_profiles rows
  sql += `-- 3. USER PROFILES TABLE\n`;
  const uRes = await pool.query(`SELECT * FROM user_profiles;`);
  for (const u of uRes.rows) {
    sql += `INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (\n`;
    sql += `  '${u.user_id}', '${(u.name || '').replace(/'/g, "''")}', ${u.phone ? `'${u.phone}'` : 'NULL'}, ${u.email ? `'${u.email.replace(/'/g, "''")}'` : 'NULL'}, '${u.active_role || 'customer'}', '${JSON.stringify(u.roles).replace(/'/g, "''")}'::jsonb, ${u.partner_type ? `'${u.partner_type}'` : 'NULL'}, '${u.partner_status || 'active'}', '${JSON.stringify(u.metadata).replace(/'/g, "''")}'::jsonb, '${u.created_at.toISOString()}', '${u.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);\n\n`;
  }

  // Dump auth_accounts rows
  sql += `-- 4. AUTH ACCOUNTS TABLE\n`;
  const aRes = await pool.query(`SELECT * FROM auth_accounts;`);
  for (const a of aRes.rows) {
    sql += `INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (\n`;
    sql += `  '${a.id}', '${a.user_id}', ${a.phone ? `'${a.phone}'` : 'NULL'}, ${a.email ? `'${a.email.replace(/'/g, "''")}'` : 'NULL'}, ${a.password_setup_required}, '${a.status || 'active'}', '${a.created_at.toISOString()}', '${a.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  fs.writeFileSync(sqlFile, sql, 'utf8');
  console.log(`VPS sync SQL dump generated at: ${sqlFile}`);
  await pool.end();
}

exportVpsSql();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function generateMasterBundle() {
  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });
  const bundlePath = path.join(__dirname, '../data/vps_master_sync_bundle.sql');

  let sql = `-- ========================================================================================
--         AMCMEP & SGE-DATAHUB MASTER VPS DATABASE SYNC BUNDLE
--         Generated on 2026-08-14
-- ========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  active_role VARCHAR(100) DEFAULT 'customer',
  roles JSONB DEFAULT '["customer"]'::jsonb,
  partner_type VARCHAR(100),
  partner_status VARCHAR(50) DEFAULT 'active',
  partner_skills JSONB DEFAULT '[]'::jsonb,
  partner_service_areas JSONB DEFAULT '[]'::jsonb,
  business_ids JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AUTH ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  phone VARCHAR(50),
  email VARCHAR(255),
  password_hash TEXT,
  password_setup_required BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  project_key TEXT DEFAULT 'amcmep',
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(100) DEFAULT 'vendor',
  location VARCHAR(255),
  source_record_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENT CONFIGS TABLE
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active BOOLEAN DEFAULT true,
  project_key TEXT DEFAULT 'amcmep',
  owner_type VARCHAR(100) DEFAULT 'platform',
  owner_id TEXT DEFAULT 'official',
  display_name VARCHAR(255) DEFAULT 'Official payment account',
  upi_id VARCHAR(255),
  account_holder VARCHAR(255),
  account_number TEXT,
  ifsc VARCHAR(50),
  bank_name VARCHAR(255),
  qr_object_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

`;

  // Insert payment_configs
  const payRes = await pool.query(`SELECT * FROM payment_configs;`);
  for (const r of payRes.rows) {
    sql += `INSERT INTO payment_configs (id, project_key, owner_type, owner_id, display_name, upi_id, account_holder, account_number, ifsc, bank_name, qr_object_key, active, metadata, created_at, updated_at) VALUES (\n`;
    sql += `  '${r.id}', '${r.project_key || 'amcmep'}', '${r.owner_type || 'platform'}', '${r.owner_id || 'official'}', '${(r.display_name || '').replace(/'/g, "''")}', '${r.upi_id || ''}', '${(r.account_holder || '').replace(/'/g, "''")}', '${r.account_number || ''}', '${r.ifsc || ''}', ${r.bank_name ? `'${r.bank_name}'` : 'NULL'}, ${r.qr_object_key ? `'${r.qr_object_key}'` : 'NULL'}, ${r.active}, '${JSON.stringify(r.metadata).replace(/'/g, "''")}', '${r.created_at.toISOString()}', '${r.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET active = EXCLUDED.active, metadata = EXCLUDED.metadata;\n\n`;
  }

  // Insert businesses
  const bizRes = await pool.query(`SELECT * FROM businesses;`);
  for (const b of bizRes.rows) {
    sql += `INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (\n`;
    sql += `  '${b.id}', '${(b.name || '').replace(/'/g, "''")}', '${b.kind || 'vendor'}', '${(b.location || '').replace(/'/g, "''")}', '${JSON.stringify(b.metadata).replace(/'/g, "''")}', '${b.created_at.toISOString()}', '${b.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  // Insert user_profiles
  const uRes = await pool.query(`SELECT * FROM user_profiles;`);
  for (const u of uRes.rows) {
    sql += `INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (\n`;
    sql += `  '${u.user_id}', '${(u.name || '').replace(/'/g, "''")}', ${u.phone ? `'${u.phone}'` : 'NULL'}, ${u.email ? `'${u.email.replace(/'/g, "''")}'` : 'NULL'}, '${u.active_role || 'customer'}', '${JSON.stringify(u.roles).replace(/'/g, "''")}'::jsonb, ${u.partner_type ? `'${u.partner_type}'` : 'NULL'}, '${u.partner_status || 'active'}', '${JSON.stringify(u.metadata).replace(/'/g, "''")}'::jsonb, '${u.created_at.toISOString()}', '${u.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);\n\n`;
  }

  // Insert auth_accounts
  const aRes = await pool.query(`SELECT * FROM auth_accounts;`);
  for (const a of aRes.rows) {
    sql += `INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (\n`;
    sql += `  '${a.id}', '${a.user_id}', ${a.phone ? `'${a.phone}'` : 'NULL'}, ${a.email ? `'${a.email.replace(/'/g, "''")}'` : 'NULL'}, ${a.password_setup_required}, '${a.status || 'active'}', '${a.created_at.toISOString()}', '${a.updated_at.toISOString()}'\n`;
    sql += `) ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  fs.writeFileSync(bundlePath, sql, 'utf8');
  console.log(`Master VPS Bundle generated at: ${bundlePath}`);
  await pool.end();
}

generateMasterBundle();

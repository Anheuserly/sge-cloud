-- ========================================================================================
--              MASTER DATABASE STRUCTURE & SCHEMA DEFINITION SCRIPT
--              Covers PostgreSQL Databases: amcmep & sge_datahub
-- ========================================================================================

-- Enable standard PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================================
-- 1. AMCMEP DATABASE TABLES SCHEMA
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- Table: user_profiles
-- Purpose: Primary user profile store for registered clients, admins, & service partners
-- ----------------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_partner_type ON user_profiles(partner_type);

-- ----------------------------------------------------------------------------------------
-- Table: auth_accounts
-- Purpose: Authentication credentials, security status, and login identifiers
-- ----------------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_phone ON auth_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_email ON auth_accounts(email);

-- ----------------------------------------------------------------------------------------
-- Table: businesses
-- Purpose: Business entity directory (vendors, manufacturers, & service providers)
-- ----------------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_kind ON businesses(kind);

-- ----------------------------------------------------------------------------------------
-- Table: payment_configs
-- Purpose: Platform & Merchant payment gateways, bank accounts, and UPI configurations
-- ----------------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_payment_configs_project_key ON payment_configs(project_key);
CREATE INDEX IF NOT EXISTS idx_payment_configs_owner ON payment_configs(owner_type, owner_id);

-- ========================================================================================
-- 2. COMMON INFRASTRUCTURE & DATAHUB TABLES SCHEMA
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- Table: infrastructure_nodes
-- Purpose: Tracking servers, microservices, databases, & VPS instances
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS infrastructure_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_name VARCHAR(255) NOT NULL,
  node_type VARCHAR(100) NOT NULL,
  ip_address VARCHAR(100),
  port INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------------------
-- Table: vps_sync_registry
-- Purpose: Real-time data sync status between local host, VPS, & Cloudflare
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vps_sync_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_database VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'success',
  records_synced INTEGER DEFAULT 0,
  checksum TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------------------
-- Table: source_records
-- Purpose: Raw imported record payload tracking
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(255) NOT NULL,
  record_type VARCHAR(100),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------------------
-- Table: source_media_files
-- Purpose: File attachment, image, & media asset registry
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  storage_provider VARCHAR(100) DEFAULT 'local',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------------------
-- Table: data_projects (sge_datahub specific)
-- Purpose: Multi-project database catalog
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_key VARCHAR(100) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================================
-- END OF SCHEMA DEFINITION SCRIPT
-- ========================================================================================

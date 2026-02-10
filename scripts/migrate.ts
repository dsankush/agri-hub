import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  // Enable UUID extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Sessions table
  `CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Products table
  `CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    product_description TEXT,
    product_type VARCHAR(255),
    sub_type VARCHAR(255),
    applied_seasons TEXT[],
    suitable_crops TEXT[],
    benefits TEXT,
    dosage VARCHAR(255),
    application_method VARCHAR(255),
    pack_sizes TEXT[],
    price_range VARCHAR(100),
    available_states TEXT[],
    organic_certified BOOLEAN NOT NULL DEFAULT false,
    iso_certified BOOLEAN NOT NULL DEFAULT false,
    govt_approved BOOLEAN NOT NULL DEFAULT false,
    product_image_url TEXT,
    source_url TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Product columns metadata (for dynamic columns)
  `CREATE TABLE IF NOT EXISTS product_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'array', 'json', 'date', 'url')),
    visible BOOLEAN NOT NULL DEFAULT true,
    filterable BOOLEAN NOT NULL DEFAULT false,
    required BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT,
    validation_rules JSONB,
    display_order INTEGER NOT NULL DEFAULT 999,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Audit logs
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Upload history
  `CREATE TABLE IF NOT EXISTS upload_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    error_log JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_name);`,
  `CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);`,
  `CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);`,
  `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', coalesce(product_name, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(brand_name, '') || ' ' || coalesce(product_description, '')));`,
  `CREATE INDEX IF NOT EXISTS idx_products_crops ON products USING gin(suitable_crops);`,
  `CREATE INDEX IF NOT EXISTS idx_products_seasons ON products USING gin(applied_seasons);`,
  `CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);`,

  // Updated_at trigger function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ language 'plpgsql';`,

  // Apply triggers
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
       CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
     END IF;
   END $$;`,

  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
       CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
     END IF;
   END $$;`,

  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_columns_updated_at') THEN
       CREATE TRIGGER update_product_columns_updated_at BEFORE UPDATE ON product_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
     END IF;
   END $$;`,
];

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  try {
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const label = sql.substring(0, 60).replace(/\n/g, ' ').trim();
      try {
        await pool.query(sql);
        console.log(`✅ [${i + 1}/${migrations.length}] ${label}...`);
      } catch (error: any) {
        if (error.code === '42710' || error.code === '42P07') {
          console.log(`⏭️  [${i + 1}/${migrations.length}] Already exists: ${label}...`);
        } else {
          console.error(`❌ [${i + 1}/${migrations.length}] Failed: ${label}`);
          console.error(error.message);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

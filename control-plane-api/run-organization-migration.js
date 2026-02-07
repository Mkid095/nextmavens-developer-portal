/**
 * Standalone script to run organizations migration
 *
 * Usage: node run-organization-migration.js
 */

const { Pool } = require('pg')

const DATABASE_URL = 'postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf:5432/nextmavens'

const pool = new Pool({
  connectionString: DATABASE_URL,
})

async function runMigration() {
  console.log('🔄 Running organizations migration...')

  try {
    // Ensure control_plane schema exists
    await pool.query(`CREATE SCHEMA IF NOT EXISTS control_plane`)
    console.log('[Migration] Ensured control_plane schema exists')

    // Check if organizations table already exists
    const orgTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'organizations'
      )
    `)

    const orgTableExists = orgTableCheck.rows[0].exists

    if (!orgTableExists) {
      // Create organizations table
      await pool.query(`
        CREATE TABLE control_plane.organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          owner_id VARCHAR(255) NOT NULL,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMPTZ
        );
      `)
      console.log('[Migration] Created organizations table')
    } else {
      console.log('[Migration] organizations table already exists')
    }

    // Check if organization_members table already exists
    const memberTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'organization_members'
      )
    `)

    const memberTableExists = memberTableCheck.rows[0].exists

    if (!memberTableExists) {
      // Create organization_members table
      await pool.query(`
        CREATE TABLE control_plane.organization_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id UUID NOT NULL REFERENCES control_plane.organizations(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'developer',
          status VARCHAR(20) NOT NULL DEFAULT 'accepted',
          invited_by VARCHAR(255),
          invited_at TIMESTAMPTZ,
          accepted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          UNIQUE(org_id, user_id)
        );
      `)
      console.log('[Migration] Created organization_members table')
    } else {
      console.log('[Migration] organization_members table already exists')
    }

    // Check if indexes exist
    const indexChecks = [
      { name: 'idx_organizations_owner_id', sql: 'CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON control_plane.organizations(owner_id)' },
      { name: 'idx_organizations_slug', sql: 'CREATE INDEX IF NOT EXISTS idx_organizations_slug ON control_plane.organizations(slug)' },
      { name: 'idx_organization_members_org_id', sql: 'CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON control_plane.organization_members(org_id)' },
      { name: 'idx_organization_members_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON control_plane.organization_members(user_id)' },
      { name: 'idx_organization_members_status', sql: 'CREATE INDEX IF NOT EXISTS idx_organization_members_status ON control_plane.organization_members(status)' },
    ]

    for (const index of indexChecks) {
      try {
        await pool.query(index.sql)
        console.log(`[Migration] Created ${index.name} index (or already exists)`)
      } catch (e) {
        console.log(`[Migration] ${index.name} index: ${e.message}`)
      }
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.organizations IS 'Organization profiles for multi-tenant access control';
    `)

    await pool.query(`
      COMMENT ON TABLE control_plane.organization_members IS 'User memberships in organizations with roles';
    `)

    console.log('[Migration] Added comments to organization tables')

    console.log('✅ Organizations migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Organizations migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()

import { getPool } from '@/lib/db'

/**
 * Create organizations and organization_members tables
 *
 * These tables support organization-based multi-tenancy with proper access control.
 *
 * - organizations: Organization profiles and settings
 * - organization_members: User membership in organizations with roles
 */
export async function createOrganizationsTables() {
  const pool = getPool()

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
      { name: 'idx_organizations_owner_id', sql: 'CREATE INDEX idx_organizations_owner_id ON control_plane.organizations(owner_id)' },
      { name: 'idx_organizations_slug', sql: 'CREATE INDEX idx_organizations_slug ON control_plane.organizations(slug)' },
      { name: 'idx_organization_members_org_id', sql: 'CREATE INDEX idx_organization_members_org_id ON control_plane.organization_members(org_id)' },
      { name: 'idx_organization_members_user_id', sql: 'CREATE INDEX idx_organization_members_user_id ON control_plane.organization_members(user_id)' },
      { name: 'idx_organization_members_status', sql: 'CREATE INDEX idx_organization_members_status ON control_plane.organization_members(status)' },
    ]

    for (const index of indexChecks) {
      const indexCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'control_plane'
          AND indexname = '${index.name}'
        )
      `)

      const indexExists = indexCheck.rows[0].exists

      if (!indexExists) {
        await pool.query(index.sql)
        console.log(`[Migration] Created ${index.name} index`)
      } else {
        console.log(`[Migration] ${index.name} index already exists`)
      }
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.organizations IS 'Organization profiles for multi-tenant access control';
    `)

    await pool.query(`
      COMMENT ON TABLE control_plane.organization_members IS 'User memberships in organizations with roles';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organizations.id IS 'Unique organization identifier (UUID)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organizations.name IS 'Organization display name';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organizations.slug IS 'URL-friendly unique identifier';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organizations.owner_id IS 'User ID of the organization owner';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organizations.settings IS 'Organization settings and preferences (JSONB)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organization_members.id IS 'Unique membership ID';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organization_members.org_id IS 'Organization ID';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organization_members.user_id IS 'User ID of the member';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organization_members.role IS 'Member role: owner, admin, developer, viewer';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.organization_members.status IS 'Membership status: pending, accepted, declined';
    `)

    console.log('[Migration] Added comments to organization tables')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating organization tables:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop organization tables
 *
 * WARNING: This will cause data loss of all organizations and memberships.
 */
export async function dropOrganizationsTables() {
  const pool = getPool()

  try {
    // Drop indexes first
    const indexes = [
      'idx_organization_members_status',
      'idx_organization_members_user_id',
      'idx_organization_members_org_id',
      'idx_organizations_slug',
      'idx_organizations_owner_id',
    ]

    for (const indexName of indexes) {
      await pool.query(`DROP INDEX IF EXISTS control_plane.${indexName}`)
    }
    console.log('[Migration] Dropped organization table indexes')

    // Drop tables
    await pool.query(`DROP TABLE IF EXISTS control_plane.organization_members`)
    console.log('[Migration] Dropped organization_members table')

    await pool.query(`DROP TABLE IF EXISTS control_plane.organizations`)
    console.log('[Migration] Dropped organizations table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping organization tables:', error)
    return { success: false, error }
  }
}

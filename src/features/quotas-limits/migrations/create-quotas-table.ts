import { getPool } from '@/lib/db'

/**
 * Migration: Create Quotas Table
 *
 * This migration creates the quotas table in the control_plane schema
 * to define monthly resource allowances per project (quotas vs hard caps).
 *
 * Columns:
 * - project_id: Reference to the project
 * - service: Service type (db_queries, storage_mb, realtime_connections, function_invocations, auth_users)
 * - monthly_limit: Monthly resource allowance (business logic limit)
 * - hard_cap: Hard cap for abuse prevention (exceeding this triggers auto-suspend)
 * - reset_at: When the quota resets (typically monthly)
 * - created_at: When this quota record was created
 * - updated_at: When this quota record was last updated
 *
 * Primary key: (project_id, service) - one quota per project per service
 *
 * PRD: US-001 from prd-quotas-limits.json
 */
export async function createQuotasTable() {
  const pool = getPool()

  try {
    // Check if control_plane schema exists
    const schemaCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata
        WHERE schema_name = 'control_plane'
      )
    `)

    const schemaExists = schemaCheck.rows[0].exists

    if (!schemaExists) {
      // Create control_plane schema
      await pool.query(`CREATE SCHEMA IF NOT EXISTS control_plane`)
      console.log('[Migration] Created control_plane schema')
    } else {
      console.log('[Migration] control_plane schema already exists')
    }

    // Check if quotas table exists in control_plane schema
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'quotas'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create quotas table with composite primary key
      await pool.query(`
        CREATE TABLE control_plane.quotas (
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          service VARCHAR(50) NOT NULL,
          monthly_limit INTEGER NOT NULL DEFAULT 0,
          hard_cap INTEGER NOT NULL DEFAULT 0,
          reset_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (project_id, service)
        )
      `)
      console.log('[Migration] Created control_plane.quotas table')
    } else {
      console.log('[Migration] control_plane.quotas table already exists')
    }

    // Create or replace check constraint for valid services
    const constraintCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = 'check_quotas_service'
      )
    `)

    const constraintExists = constraintCheck.rows[0].exists

    if (!constraintExists) {
      await pool.query(`
        ALTER TABLE control_plane.quotas
        ADD CONSTRAINT check_quotas_service
        CHECK (service IN ('db_queries', 'storage_mb', 'realtime_connections', 'function_invocations', 'auth_users'))
      `)
      console.log('[Migration] Added check constraint for service column')
    } else {
      console.log('[Migration] Service check constraint already exists')
    }

    // Create index on project_id for efficient queries
    const projectIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'quotas'
        AND indexname = 'idx_quotas_project_id'
      )
    `)

    const projectIndexExists = projectIndexCheck.rows[0].exists

    if (!projectIndexExists) {
      await pool.query(`
        CREATE INDEX idx_quotas_project_id ON control_plane.quotas(project_id)
      `)
      console.log('[Migration] Created index on project_id')
    } else {
      console.log('[Migration] Index on project_id already exists')
    }

    // Create index on service for filtering
    const serviceIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'quotas'
        AND indexname = 'idx_quotas_service'
      )
    `)

    const serviceIndexExists = serviceIndexCheck.rows[0].exists

    if (!serviceIndexExists) {
      await pool.query(`
        CREATE INDEX idx_quotas_service ON control_plane.quotas(service)
      `)
      console.log('[Migration] Created index on service')
    } else {
      console.log('[Migration] Index on service already exists')
    }

    // Create index on reset_at for quota reset queries
    const resetIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'quotas'
        AND indexname = 'idx_quotas_reset_at'
      )
    `)

    const resetIndexExists = resetIndexCheck.rows[0].exists

    if (!resetIndexExists) {
      await pool.query(`
        CREATE INDEX idx_quotas_reset_at ON control_plane.quotas(reset_at)
      `)
      console.log('[Migration] Created index on reset_at')
    } else {
      console.log('[Migration] Index on reset_at already exists')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.quotas IS 'Monthly resource allowances per project (quotas vs hard caps)'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.project_id IS 'Reference to the project'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.service IS 'Service type: db_queries, storage_mb, realtime_connections, function_invocations, auth_users'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.monthly_limit IS 'Monthly resource allowance (business logic limit)'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.hard_cap IS 'Hard cap for abuse prevention (exceeding this triggers auto-suspend)'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.reset_at IS 'When the quota resets (typically monthly)'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.created_at IS 'When this quota record was created'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.quotas.updated_at IS 'When this quota record was last updated'
    `)

    console.log('[Migration] Added comments to quotas table')

    // Insert migration record into schema_migrations if it exists
    const migrationsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'schema_migrations'
      )
    `)

    const migrationsTableExists = migrationsTableCheck.rows[0].exists

    if (migrationsTableExists) {
      // Check if this migration was already recorded
      const migrationRecordCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM control_plane.schema_migrations
          WHERE version = '009'
        )
      `)

      const migrationRecordExists = migrationRecordCheck.rows[0].exists

      if (!migrationRecordExists) {
        await pool.query(`
          INSERT INTO control_plane.schema_migrations (version, description, breaking)
          VALUES ('009', 'Create quotas table for monthly resource allowances per project', FALSE)
        `)
        console.log('[Migration] Inserted migration record')
      } else {
        console.log('[Migration] Migration record already exists')
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating quotas table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop quotas table
 *
 * This function removes the quotas table if needed for rollback.
 * WARNING: This will cause data loss of quota configurations.
 */
export async function rollbackCreateQuotasTable() {
  const pool = getPool()

  try {
    // Drop indexes first
    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_quotas_project_id`)
    console.log('[Migration] Dropped idx_quotas_project_id')

    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_quotas_service`)
    console.log('[Migration] Dropped idx_quotas_service')

    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_quotas_reset_at`)
    console.log('[Migration] Dropped idx_quotas_reset_at')

    // Drop the table
    await pool.query(`DROP TABLE IF EXISTS control_plane.quotas`)
    console.log('[Migration] Dropped control_plane.quotas table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back quotas table:', error)
    return { success: false, error }
  }
}

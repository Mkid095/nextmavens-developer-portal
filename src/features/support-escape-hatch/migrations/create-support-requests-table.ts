import { getPool } from '@/lib/db'

/**
 * Migration: Create Support Requests Table
 *
 * This migration creates the support_requests table in the control_plane schema
 * to track support tickets per project with status and context.
 *
 * Columns:
 * - id: Unique identifier for the support request (UUID)
 * - project_id: Reference to the project
 * - user_id: User who created the support request
 * - subject: Subject/title of the support request
 * - description: Detailed description of the issue
 * - context: Additional context (JSONB): project info, errors, logs, usage metrics
 * - status: Current status: open, in_progress, resolved, closed
 * - created_at: When the support request was created
 * - resolved_at: When the support request was resolved (null if not resolved)
 *
 * PRD: US-001 from prd-support-escape-hatch.json
 */
export async function createSupportRequestsTable() {
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

    // Check if support_requests table exists in control_plane schema
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'support_requests'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create support_requests table
      await pool.query(`
        CREATE TABLE control_plane.support_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL,
          subject VARCHAR(500) NOT NULL,
          description TEXT NOT NULL,
          context JSONB,
          status VARCHAR(50) NOT NULL DEFAULT 'open',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          resolved_at TIMESTAMPTZ
        )
      `)
      console.log('[Migration] Created control_plane.support_requests table')
    } else {
      console.log('[Migration] control_plane.support_requests table already exists')
    }

    // Create or replace check constraint for valid statuses
    const constraintCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = 'check_support_requests_status'
      )
    `)

    const constraintExists = constraintCheck.rows[0].exists

    if (!constraintExists) {
      await pool.query(`
        ALTER TABLE control_plane.support_requests
        ADD CONSTRAINT check_support_requests_status
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
      `)
      console.log('[Migration] Added check constraint for status column')
    } else {
      console.log('[Migration] Status check constraint already exists')
    }

    // Create index on project_id for efficient queries
    const projectIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'support_requests'
        AND indexname = 'idx_support_requests_project_id'
      )
    `)

    const projectIndexExists = projectIndexCheck.rows[0].exists

    if (!projectIndexExists) {
      await pool.query(`
        CREATE INDEX idx_support_requests_project_id ON control_plane.support_requests(project_id)
      `)
      console.log('[Migration] Created index on project_id')
    } else {
      console.log('[Migration] Index on project_id already exists')
    }

    // Create index on status for filtering
    const statusIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'support_requests'
        AND indexname = 'idx_support_requests_status'
      )
    `)

    const statusIndexExists = statusIndexCheck.rows[0].exists

    if (!statusIndexExists) {
      await pool.query(`
        CREATE INDEX idx_support_requests_status ON control_plane.support_requests(status)
      `)
      console.log('[Migration] Created index on status')
    } else {
      console.log('[Migration] Index on status already exists')
    }

    // Create composite index on project_id and status for common queries
    const compositeIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'support_requests'
        AND indexname = 'idx_support_requests_project_id_status'
      )
    `)

    const compositeIndexExists = compositeIndexCheck.rows[0].exists

    if (!compositeIndexExists) {
      await pool.query(`
        CREATE INDEX idx_support_requests_project_id_status ON control_plane.support_requests(project_id, status)
      `)
      console.log('[Migration] Created composite index on project_id and status')
    } else {
      console.log('[Migration] Composite index on project_id and status already exists')
    }

    // Create index on user_id for user-specific queries
    const userIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND tablename = 'support_requests'
        AND indexname = 'idx_support_requests_user_id'
      )
    `)

    const userIndexExists = userIndexCheck.rows[0].exists

    if (!userIndexExists) {
      await pool.query(`
        CREATE INDEX idx_support_requests_user_id ON control_plane.support_requests(user_id)
      `)
      console.log('[Migration] Created index on user_id')
    } else {
      console.log('[Migration] Index on user_id already exists')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.support_requests IS 'Support tickets per project with status and context'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.id IS 'Unique identifier for the support request'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.project_id IS 'Reference to the project'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.user_id IS 'User who created the support request'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.subject IS 'Subject/title of the support request'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.description IS 'Detailed description of the issue'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.context IS 'Additional context (JSONB): project info, errors, logs, usage metrics'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.status IS 'Current status: open, in_progress, resolved, closed'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.created_at IS 'When the support request was created'
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.support_requests.resolved_at IS 'When the support request was resolved (null if not resolved)'
    `)

    console.log('[Migration] Added comments to support_requests table')

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
          WHERE version = '012'
        )
      `)

      const migrationRecordExists = migrationRecordCheck.rows[0].exists

      if (!migrationRecordExists) {
        await pool.query(`
          INSERT INTO control_plane.schema_migrations (version, description, breaking)
          VALUES ('012', 'Create support_requests table for tracking support tickets', FALSE)
        `)
        console.log('[Migration] Inserted migration record')
      } else {
        console.log('[Migration] Migration record already exists')
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating support_requests table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop support_requests table
 *
 * This function removes the support_requests table if needed for rollback.
 * WARNING: This will cause data loss of support request data.
 */
export async function rollbackCreateSupportRequestsTable() {
  const pool = getPool()

  try {
    // Drop indexes first
    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_support_requests_project_id`)
    console.log('[Migration] Dropped idx_support_requests_project_id')

    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_support_requests_status`)
    console.log('[Migration] Dropped idx_support_requests_status')

    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_support_requests_project_id_status`)
    console.log('[Migration] Dropped idx_support_requests_project_id_status')

    await pool.query(`DROP INDEX IF EXISTS control_plane.idx_support_requests_user_id`)
    console.log('[Migration] Dropped idx_support_requests_user_id')

    // Drop the table
    await pool.query(`DROP TABLE IF EXISTS control_plane.support_requests`)
    console.log('[Migration] Dropped control_plane.support_requests table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back support_requests table:', error)
    return { success: false, error }
  }
}

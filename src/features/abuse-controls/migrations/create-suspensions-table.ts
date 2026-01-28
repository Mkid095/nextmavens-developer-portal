import { getPool } from '@/lib/db'
import { Pool } from 'pg'

/**
 * Migration: Create suspensions and suspension_history tables
 *
 * These tables track project suspensions due to hard cap violations.
 * - suspensions: Current active suspensions for projects
 * - suspension_history: Complete audit trail of all suspension actions
 */
export async function createSuspensionsTable() {
  const pool = getPool()

  try {
    // Check if suspensions table exists
    const suspensionsCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'suspensions'
      )
    `)

    const suspensionsTableExists = suspensionsCheckResult.rows[0].exists

    if (!suspensionsTableExists) {
      // Create the suspensions table
      await pool.query(`
        CREATE TABLE suspensions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
          reason JSONB NOT NULL,
          cap_exceeded VARCHAR(50) NOT NULL,
          suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          resolved_at TIMESTAMP WITH TIME ZONE,
          notes TEXT
        )
      `)

      console.log('[Migration] Created suspensions table')

      // Create index on project_id for faster lookups
      await pool.query(`
        CREATE INDEX idx_suspensions_project_id ON suspensions(project_id)
      `)

      console.log('[Migration] Created index on suspensions.project_id')

      // Create index on resolved_at for filtering active suspensions
      await pool.query(`
        CREATE INDEX idx_suspensions_resolved_at ON suspensions(resolved_at)
        WHERE resolved_at IS NULL
      `)

      console.log('[Migration] Created index on suspensions.resolved_at')

      // Create index on suspended_at for time-based queries
      await pool.query(`
        CREATE INDEX idx_suspensions_suspended_at ON suspensions(suspended_at)
      `)

      console.log('[Migration] Created index on suspensions.suspended_at')
    } else {
      console.log('[Migration] suspensions table already exists')
    }

    // Check if suspension_history table exists
    const historyCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'suspension_history'
      )
    `)

    const historyTableExists = historyCheckResult.rows[0].exists

    if (!historyTableExists) {
      // Create the suspension_history table
      await pool.query(`
        CREATE TABLE suspension_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          action VARCHAR(20) NOT NULL CHECK (action IN ('suspended', 'unsuspended')),
          reason JSONB NOT NULL,
          occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT
        )
      `)

      console.log('[Migration] Created suspension_history table')

      // Create index on project_id for audit trail queries
      await pool.query(`
        CREATE INDEX idx_suspension_history_project_id ON suspension_history(project_id)
      `)

      console.log('[Migration] Created index on suspension_history.project_id')

      // Create index on occurred_at for time-based queries
      await pool.query(`
        CREATE INDEX idx_suspension_history_occurred_at ON suspension_history(occurred_at)
      `)

      console.log('[Migration] Created index on suspension_history.occurred_at')

      // Create index on action for filtering by action type
      await pool.query(`
        CREATE INDEX idx_suspension_history_action ON suspension_history(action)
      `)

      console.log('[Migration] Created index on suspension_history.action')
    } else {
      console.log('[Migration] suspension_history table already exists')
    }

    // Add check constraint for cap_exceeded
    await ensureCapExceededCheck(pool)

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating suspensions tables:', error)
    return { success: false, error }
  }
}

/**
 * Ensure cap_exceeded has proper check constraints
 */
async function ensureCapExceededCheck(pool: Pool) {
  try {
    // Check if check constraint exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = 'suspensions_cap_exceeded_check'
      )
    `)

    const constraintExists = checkResult.rows[0].exists

    if (!constraintExists) {
      // Add check constraint for valid cap types
      await pool.query(`
        ALTER TABLE suspensions
        ADD CONSTRAINT suspensions_cap_exceeded_check
        CHECK (cap_exceeded IN (
          'db_queries_per_day',
          'realtime_connections',
          'storage_uploads_per_day',
          'function_invocations_per_day'
        ))
      `)

      console.log('[Migration] Added cap_exceeded check constraint')
    }
  } catch (error) {
    console.error('[Migration] Error adding cap_exceeded constraint:', error)
    throw error
  }
}

/**
 * Add status column to projects table if it doesn't exist
 */
export async function addProjectStatusColumn() {
  const pool = getPool()

  try {
    // Check if status column exists in projects table
    const columnCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'status'
      )
    `)

    const columnExists = columnCheckResult.rows[0].exists

    if (!columnExists) {
      // Add status column to projects table
      await pool.query(`
        ALTER TABLE projects
        ADD COLUMN status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'suspended'))
      `)

      console.log('[Migration] Added status column to projects table')

      // Create index on status for filtering active/suspended projects
      await pool.query(`
        CREATE INDEX idx_projects_status ON projects(status)
      `)

      console.log('[Migration] Created index on projects.status')
    } else {
      console.log('[Migration] projects.status column already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding status column to projects table:', error)
    return { success: false, error }
  }
}

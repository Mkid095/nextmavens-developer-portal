import { getPool } from '@/lib/db'
import { Pool } from 'pg'

/**
 * Migration: Create manual_overrides table
 *
 * This table tracks manual override operations performed by administrators.
 * Manual overrides allow admins to:
 * - Unsuspend suspended projects
 * - Increase hard caps for projects
 * - Both unsuspend and increase caps
 *
 * All overrides are fully audited with reason, performer, and timestamp.
 */
export async function createManualOverridesTable() {
  const pool = getPool()

  try {
    // Check if manual_overrides table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'manual_overrides'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the manual_overrides table
      await pool.query(`
        CREATE TABLE manual_overrides (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          action VARCHAR(20) NOT NULL,
          reason TEXT NOT NULL,
          notes TEXT,
          previous_caps JSONB NOT NULL DEFAULT '{}',
          new_caps JSONB,
          performed_by UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
          performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address INET,
          previous_status VARCHAR(20) NOT NULL,
          new_status VARCHAR(20),

          -- Check constraint for valid action types
          CONSTRAINT manual_overrides_action_check
            CHECK (action IN ('unsuspend', 'increase_caps', 'both')),

          -- Check constraint for valid project status values
          CONSTRAINT manual_overrides_status_check
            CHECK (previous_status IN ('active', 'suspended') AND
                   (new_status IS NULL OR new_status IN ('active', 'suspended')))
        )
      `)

      console.log('[Migration] Created manual_overrides table')

      // Create index on project_id for querying project override history
      await pool.query(`
        CREATE INDEX idx_manual_overrides_project_id
        ON manual_overrides(project_id)
      `)

      console.log('[Migration] Created index on manual_overrides.project_id')

      // Create index on performed_at DESC for chronological queries
      await pool.query(`
        CREATE INDEX idx_manual_overrides_performed_at
        ON manual_overrides(performed_at DESC)
      `)

      console.log('[Migration] Created index on manual_overrides.performed_at')

      // Create index on performed_by for operator activity queries
      await pool.query(`
        CREATE INDEX idx_manual_overrides_performed_by
        ON manual_overrides(performed_by)
      `)

      console.log('[Migration] Created index on manual_overrides.performed_by')

      // Create composite index for project history queries
      await pool.query(`
        CREATE INDEX idx_manual_overrides_project_performed_at
        ON manual_overrides(project_id, performed_at DESC)
      `)

      console.log('[Migration] Created composite index on (project_id, performed_at)')

      // Add comments for documentation
      await pool.query(`
        COMMENT ON TABLE manual_overrides IS
        'Tracks manual override operations performed by administrators'

        COMMENT ON COLUMN manual_overrides.id IS
        'Unique identifier for the override'

        COMMENT ON COLUMN manual_overrides.project_id IS
        'Project ID that was overridden'

        COMMENT ON COLUMN manual_overrides.action IS
        'Type of override: unsuspend, increase_caps, or both'

        COMMENT ON COLUMN manual_overrides.reason IS
        'Required reason for the override (audit requirement)'

        COMMENT ON COLUMN manual_overrides.notes IS
        'Optional additional notes or context'

        COMMENT ON COLUMN manual_overrides.previous_caps IS
        'Snapshot of cap values before the override'

        COMMENT ON COLUMN manual_overrides.new_caps IS
        'New cap values if caps were increased'

        COMMENT ON COLUMN manual_overrides.performed_by IS
        'User ID of the administrator who performed the override'

        COMMENT ON COLUMN manual_overrides.performed_at IS
        'Timestamp when the override was performed'

        COMMENT ON COLUMN manual_overrides.ip_address IS
        'IP address of the performer (if available)'

        COMMENT ON COLUMN manual_overrides.previous_status IS
        'Project status before the override'

        COMMENT ON COLUMN manual_overrides.new_status IS
        'Project status after the override'
      `)

      console.log('[Migration] Added table and column comments')
    } else {
      console.log('[Migration] manual_overrides table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating manual_overrides table:', error)
    return { success: false, error }
  }
}

/**
 * Ensure developers table has role column for authorization
 * This is needed to verify that the performer has admin privileges
 */
export async function ensureDevelopersRoleColumn() {
  const pool = getPool()

  try {
    // Check if role column exists in developers table
    const columnCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'developers'
        AND column_name = 'role'
      )
    `)

    const columnExists = columnCheckResult.rows[0].exists

    if (!columnExists) {
      // Add role column to developers table
      await pool.query(`
        ALTER TABLE developers
        ADD COLUMN role VARCHAR(20) DEFAULT 'developer'
        CHECK (role IN ('developer', 'admin', 'super_admin'))
      `)

      console.log('[Migration] Added role column to developers table')

      // Create index on role for filtering by role
      await pool.query(`
        CREATE INDEX idx_developers_role ON developers(role)
      `)

      console.log('[Migration] Created index on developers.role')
    } else {
      console.log('[Migration] developers.role column already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding role column to developers table:', error)
    return { success: false, error }
  }
}

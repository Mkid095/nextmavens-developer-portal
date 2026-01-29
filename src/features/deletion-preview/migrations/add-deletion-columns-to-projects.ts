import { getPool } from '@/lib/db'

/**
 * Migration: Add Deletion Columns to Projects Table
 *
 * This migration adds soft delete functionality to the projects table
 * by adding three new timestamp columns:
 * - deleted_at: When the project was marked as deleted
 * - deletion_scheduled_at: When deletion was initiated
 * - grace_period_ends_at: When the grace period ends (hard delete date)
 *
 * All columns are nullable TIMESTAMPTZ to support soft delete workflow.
 */
export async function addDeletionColumnsToProjects() {
  const pool = getPool()

  try {
    // Check if deleted_at column exists
    const deletedAtCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'deleted_at'
      )
    `)

    const deletedAtExists = deletedAtCheck.rows[0].exists

    if (!deletedAtExists) {
      // Add deleted_at column
      await pool.query(`
        ALTER TABLE projects
        ADD COLUMN deleted_at TIMESTAMPTZ
      `)

      console.log('[Migration] Added deleted_at column to projects table')
    } else {
      console.log('[Migration] deleted_at column already exists in projects table')
    }

    // Check if deletion_scheduled_at column exists
    const deletionScheduledCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'deletion_scheduled_at'
      )
    `)

    const deletionScheduledExists = deletionScheduledCheck.rows[0].exists

    if (!deletionScheduledExists) {
      // Add deletion_scheduled_at column
      await pool.query(`
        ALTER TABLE projects
        ADD COLUMN deletion_scheduled_at TIMESTAMPTZ
      `)

      console.log('[Migration] Added deletion_scheduled_at column to projects table')
    } else {
      console.log('[Migration] deletion_scheduled_at column already exists in projects table')
    }

    // Check if grace_period_ends_at column exists
    const gracePeriodCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'grace_period_ends_at'
      )
    `)

    const gracePeriodExists = gracePeriodCheck.rows[0].exists

    if (!gracePeriodExists) {
      // Add grace_period_ends_at column
      await pool.query(`
        ALTER TABLE projects
        ADD COLUMN grace_period_ends_at TIMESTAMPTZ
      `)

      console.log('[Migration] Added grace_period_ends_at column to projects table')
    } else {
      console.log('[Migration] grace_period_ends_at column already exists in projects table')
    }

    // Create comment on columns for documentation
    await pool.query(`
      COMMENT ON COLUMN projects.deleted_at IS 'Timestamp when the project was hard deleted. NULL for active projects.'
    `)

    await pool.query(`
      COMMENT ON COLUMN projects.deletion_scheduled_at IS 'Timestamp when deletion was initiated. Starts the grace period.'
    `)

    await pool.query(`
      COMMENT ON COLUMN projects.grace_period_ends_at IS 'Timestamp when the 30-day grace period ends. After this date, project can be hard deleted.'
    `)

    console.log('[Migration] Added comments to deletion columns')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding deletion columns to projects table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Remove deletion columns from projects table
 *
 * This function removes the deletion columns if needed for rollback.
 * WARNING: This will cause data loss if any projects are in deletion state.
 */
export async function rollbackDeletionColumns() {
  const pool = getPool()

  try {
    // Drop columns in reverse order
    await pool.query(`
      ALTER TABLE projects
      DROP COLUMN IF EXISTS grace_period_ends_at
    `)

    console.log('[Migration] Dropped grace_period_ends_at column')

    await pool.query(`
      ALTER TABLE projects
      DROP COLUMN IF EXISTS deletion_scheduled_at
    `)

    console.log('[Migration] Dropped deletion_scheduled_at column')

    await pool.query(`
      ALTER TABLE projects
      DROP COLUMN IF EXISTS deleted_at
    `)

    console.log('[Migration] Dropped deleted_at column')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back deletion columns:', error)
    return { success: false, error }
  }
}

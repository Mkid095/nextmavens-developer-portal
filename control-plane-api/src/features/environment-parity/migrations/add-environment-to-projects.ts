import { getPool } from '@/lib/db'

/**
 * Migration: Add Environment Column to Projects Table
 *
 * This migration adds environment awareness to projects by adding an environment column.
 * The environment field allows different behavior based on whether a project is in
 * production, development, or staging environment.
 *
 * Environment enum: prod, dev, staging
 * Default value: prod (for safety - production behavior by default)
 *
 * This enables per-environment configuration for:
 * - Rate limiting (higher limits in dev/staging)
 * - Auto-suspend behavior (disabled in non-prod)
 * - Logging verbosity (debug in dev/staging)
 * - Webhook retry policies
 */
export async function addEnvironmentToProjects() {
  const pool = getPool()

  try {
    // Check if environment column exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'environment'
      )
    `)

    const columnExists = columnCheck.rows[0].exists

    if (!columnExists) {
      // Add environment column with default value
      await pool.query(`
        ALTER TABLE projects
        ADD COLUMN environment VARCHAR(10) DEFAULT 'prod' NOT NULL
      `)

      console.log('[Migration] Added environment column to projects table')

      // Create a CHECK constraint for valid environment values
      await pool.query(`
        ALTER TABLE projects
        ADD CONSTRAINT projects_environment_check
        CHECK (environment IN ('prod', 'dev', 'staging'))
      `)

      console.log('[Migration] Added environment check constraint')
    } else {
      console.log('[Migration] environment column already exists in projects table')
    }

    // Create comment on column for documentation
    await pool.query(`
      COMMENT ON COLUMN projects.environment IS 'Project environment: prod (production), dev (development), or staging. Controls environment-specific behavior like rate limiting, auto-suspend, and logging.'
    `)

    console.log('[Migration] Added comment to environment column')

    // Update any existing projects that might have NULL environment
    // (shouldn't happen with DEFAULT, but just to be safe)
    await pool.query(`
      UPDATE projects
      SET environment = 'prod'
      WHERE environment IS NULL
    `)

    console.log('[Migration] Ensured all existing projects have environment set to prod')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding environment column to projects table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Remove environment column from projects table
 *
 * This function removes the environment column if needed for rollback.
 * WARNING: This will cause data loss and remove environment awareness from projects.
 */
export async function rollbackEnvironmentFromProjects() {
  const pool = getPool()

  try {
    // Drop the constraint first
    await pool.query(`
      ALTER TABLE projects
      DROP CONSTRAINT IF EXISTS projects_environment_check
    `)

    console.log('[Migration] Dropped environment check constraint')

    // Drop the column
    await pool.query(`
      ALTER TABLE projects
      DROP COLUMN IF EXISTS environment
    `)

    console.log('[Migration] Dropped environment column')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back environment column:', error)
    return { success: false, error }
  }
}

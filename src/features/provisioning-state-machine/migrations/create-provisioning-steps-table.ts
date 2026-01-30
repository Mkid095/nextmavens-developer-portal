import { getPool } from '@/lib/db'

/**
 * Migration: Create provisioning_steps table
 *
 * This table tracks each provisioning step separately for every project.
 * Enables safe retry from failure and better UX during project provisioning.
 *
 * Story: US-001 - Create Provisioning Steps Table
 * PRD: Provisioning State Machine
 */
export async function createProvisioningStepsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'provisioning_steps'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the provisioning_steps table
      await pool.query(`
        CREATE TABLE provisioning_steps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          step_name VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          error_details JSONB,
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(project_id, step_name)
        )
      `)

      console.log('[Migration] Created provisioning_steps table')

      // Create index for faster project lookups
      await pool.query(`
        CREATE INDEX idx_provisioning_steps_project_id ON provisioning_steps(project_id)
      `)

      console.log('[Migration] Created index on provisioning_steps.project_id')

      // Create index for started_at scheduling
      await pool.query(`
        CREATE INDEX idx_provisioning_steps_started_at ON provisioning_steps(started_at)
      `)

      console.log('[Migration] Created index on provisioning_steps.started_at')

      // Add check constraint for valid status values
      await pool.query(`
        ALTER TABLE provisioning_steps
        ADD CONSTRAINT provisioning_steps_status_check
        CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped'))
      `)

      console.log('[Migration] Added status check constraint')

      // Add check constraint for non-negative retry_count
      await pool.query(`
        ALTER TABLE provisioning_steps
        ADD CONSTRAINT provisioning_steps_retry_count_check
        CHECK (retry_count >= 0)
      `)

      console.log('[Migration] Added retry_count check constraint')
    } else {
      console.log('[Migration] provisioning_steps table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating provisioning_steps table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop provisioning_steps table
 */
export async function rollbackProvisioningStepsTable() {
  const pool = getPool()

  try {
    await pool.query(`
      DROP INDEX IF EXISTS idx_provisioning_steps_started_at
    `)

    await pool.query(`
      DROP INDEX IF EXISTS idx_provisioning_steps_project_id
    `)

    await pool.query(`
      DROP TABLE IF EXISTS provisioning_steps
    `)

    console.log('[Migration] Rolled back provisioning_steps table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back provisioning_steps table:', error)
    return { success: false, error }
  }
}

/**
 * Initialize provisioning steps for a new project
 * Creates all steps with 'pending' status
 */
export async function initializeProvisioningSteps(projectId: string) {
  const pool = getPool()

  try {
    const steps = [
      'create_tenant_database',
      'create_tenant_schema',
      'register_auth_service',
      'register_realtime_service',
      'register_storage_service',
      'generate_api_keys',
      'verify_services'
    ]

    for (const stepName of steps) {
      await pool.query(
        `
        INSERT INTO provisioning_steps (project_id, step_name, status)
        VALUES ($1, $2, 'pending')
        ON CONFLICT (project_id, step_name) DO NOTHING
        `,
        [projectId, stepName]
      )
    }

    console.log(`[Migration] Initialized provisioning steps for project ${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('[Migration] Error initializing provisioning steps:', error)
    return { success: false, error }
  }
}

/**
 * Get provisioning steps for a project
 */
export async function getProvisioningSteps(projectId: string) {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        step_name,
        status,
        started_at,
        completed_at,
        error_message,
        error_details,
        retry_count,
        created_at
      FROM provisioning_steps
      WHERE project_id = $1
      ORDER BY created_at
      `,
      [projectId]
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Migration] Error getting provisioning steps:', error)
    return { success: false, error }
  }
}

/**
 * Update provisioning step status
 */
export async function updateProvisioningStep(
  projectId: string,
  stepName: string,
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped',
  options?: {
    errorMessage?: string
    errorDetails?: Record<string, unknown>
  }
) {
  const pool = getPool()

  try {
    const now = status === 'running' ? 'started_at = NOW()' : 'completed_at = NOW()'

    await pool.query(
      `
      UPDATE provisioning_steps
      SET
        status = $1,
        ${now},
        error_message = COALESCE($2, error_message),
        error_details = COALESCE($3, error_details),
        retry_count = CASE WHEN $1 = 'failed' THEN retry_count + 1 ELSE retry_count END
      WHERE project_id = $4 AND step_name = $5
      `,
      [status, options?.errorMessage || null, options?.errorDetails || null, projectId, stepName]
    )

    console.log(`[Migration] Updated provisioning step ${stepName} to ${status}`)
    return { success: true }
  } catch (error) {
    console.error('[Migration] Error updating provisioning step:', error)
    return { success: false, error }
  }
}

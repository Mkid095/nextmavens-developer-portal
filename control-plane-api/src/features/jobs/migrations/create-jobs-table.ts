import { getPool } from '@/lib/db'

/**
 * Migration: Create jobs table for Background Jobs API
 *
 * This table stores background job records for async operations like
 * project provisioning, key rotation, webhook delivery, etc.
 *
 * Per PRD requirements:
 * - Columns: id, project_id, type, status, result, error, started_at, completed_at, created_at
 * - Job types: provision_project, rotate_key, deliver_webhook, export_backup, check_usage_limits, auto_suspend
 * - Job statuses: pending, running, failed, completed
 */
export async function createJobsTable() {
  const pool = getPool()

  try {
    // Ensure control_plane schema exists
    await pool.query(`CREATE SCHEMA IF NOT EXISTS control_plane`)

    // Check if jobs table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'jobs'
        AND table_schema = 'control_plane'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create jobs table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES control_plane.projects(id) ON DELETE CASCADE,
          type VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          input_data JSONB,
          result_data JSONB,
          error_message TEXT,
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT jobs_type_check CHECK (type IN (
            'provision_project',
            'rotate_key',
            'deliver_webhook',
            'export_backup',
            'check_usage_limits',
            'auto_suspend'
          )),

          CONSTRAINT jobs_status_check CHECK (status IN (
            'pending',
            'running',
            'failed',
            'completed'
          ))
        )
      `)

      console.log('[Migration] Created jobs table in control_plane schema')

      // Create indexes for efficient queries
      await pool.query(`
        CREATE INDEX idx_jobs_project_id
        ON control_plane.jobs(project_id)
      `)

      await pool.query(`
        CREATE INDEX idx_jobs_type
        ON control_plane.jobs(type)
      `)

      await pool.query(`
        CREATE INDEX idx_jobs_status
        ON control_plane.jobs(status)
      `)

      await pool.query(`
        CREATE INDEX idx_jobs_created_at
        ON control_plane.jobs(created_at DESC)
      `)

      await pool.query(`
        CREATE INDEX idx_jobs_project_status
        ON control_plane.jobs(project_id, status)
      `)

      console.log('[Migration] Created indexes on jobs table')

      // Add table and column comments for documentation
      await pool.query(`
        COMMENT ON TABLE control_plane.jobs IS 'Background job records for async operations'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.id IS 'Unique job identifier (UUID)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.project_id IS 'Associated project ID (nullable for system jobs)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.type IS 'Job type: provision_project, rotate_key, deliver_webhook, export_backup, check_usage_limits, auto_suspend'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.status IS 'Job status: pending, running, failed, completed'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.input_data IS 'Job input parameters (JSONB)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.result_data IS 'Job result output (JSONB)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.error_message IS 'Error message if job failed'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.started_at IS 'Timestamp when job started'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.jobs.completed_at IS 'Timestamp when job completed'
      `)

      console.log('[Migration] Added comments to jobs table')

    } else {
      console.log('[Migration] jobs table already exists in control_plane schema')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating jobs table:', error)
    return { success: false, error }
  }
}

/**
 * Create a new background job
 */
export async function createJob(
  projectId: string | null,
  type: string,
  inputData: Record<string, unknown> = {}
): Promise<{ success: boolean; job?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO control_plane.jobs (project_id, type, status, input_data)
      VALUES ($1, $2, 'pending', $3)
      RETURNING *
      `,
      [projectId, type, JSON.stringify(inputData)]
    )

    return { success: true, job: result.rows[0] }
  } catch (error) {
    console.error('[Jobs] Error creating job:', error)
    return { success: false, error }
  }
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<{ success: boolean; job?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT * FROM control_plane.jobs
      WHERE id = $1
      `,
      [jobId]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Job not found' }
    }

    return { success: true, job: result.rows[0] }
  } catch (error) {
    console.error('[Jobs] Error getting job:', error)
    return { success: false, error }
  }
}

/**
 * Update job status and result
 */
export async function updateJob(
  jobId: string,
  updates: {
    status?: string;
    result_data?: Record<string, unknown>;
    error_message?: string;
    started_at?: Date;
    completed_at?: Date;
  }
): Promise<{ success: boolean; job?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const setClause: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex++}`)
        values.push(key === 'started_at' || key === 'completed_at' ? value : JSON.stringify(value))
      }
    })

    if (setClause.length === 0) {
      return { success: false, error: 'No updates provided' }
    }

    setClause.push(`updated_at = NOW()`)
    values.push(jobId)

    const result = await pool.query(
      `
      UPDATE control_plane.jobs
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
      `,
      values
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Job not found' }
    }

    return { success: true, job: result.rows[0] }
  } catch (error) {
    console.error('[Jobs] Error updating job:', error)
    return { success: false, error }
  }
}

/**
 * List jobs with filters
 */
export async function listJobs(
  filters: {
    project_id?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ success: boolean; jobs?: any[]; total?: number; error?: unknown }> {
  const pool = getPool()

  try {
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (filters.project_id) {
      conditions.push(`project_id = $${paramIndex++}`)
      values.push(filters.project_id)
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`)
      values.push(filters.type)
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(filters.status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    // Get total count
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM control_plane.jobs
      ${whereClause}
      `,
      values
    )

    const total = parseInt(countResult.rows[0].total)

    // Get jobs with pagination
    values.push(limit, offset)
    const result = await pool.query(
      `
      SELECT * FROM control_plane.jobs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
      values
    )

    return { success: true, jobs: result.rows, total }
  } catch (error) {
    console.error('[Jobs] Error listing jobs:', error)
    return { success: false, error }
  }
}

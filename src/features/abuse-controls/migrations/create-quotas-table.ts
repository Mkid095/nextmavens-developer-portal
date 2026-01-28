import { getPool } from '@/lib/db'

/**
 * Migration: Create project_quotas table
 *
 * This table stores hard cap configurations for each project.
 * Hard caps prevent abuse by limiting resource usage per project.
 */
export async function createQuotasTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'project_quotas'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the project_quotas table
      await pool.query(`
        CREATE TABLE project_quotas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          cap_type VARCHAR(50) NOT NULL,
          cap_value INTEGER NOT NULL CHECK (cap_value > 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(project_id, cap_type)
        )
      `)

      console.log('[Migration] Created project_quotas table')

      // Create index for faster lookups
      await pool.query(`
        CREATE INDEX idx_project_quotas_project_id ON project_quotas(project_id)
      `)

      console.log('[Migration] Created index on project_quotas.project_id')

      // Create index for cap type lookups
      await pool.query(`
        CREATE INDEX idx_project_quotas_cap_type ON project_quotas(cap_type)
      `)

      console.log('[Migration] Created index on project_quotas.cap_type')
    } else {
      console.log('[Migration] project_quotas table already exists')
    }

    // Ensure all cap types have constraints
    await ensureCapTypeCheck(pool)

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating project_quotas table:', error)
    return { success: false, error }
  }
}

/**
 * Ensure cap_type has proper check constraints
 */
async function ensureCapTypeCheck(pool: any) {
  try {
    // Check if check constraint exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = 'project_quotas_cap_type_check'
      )
    `)

    const constraintExists = checkResult.rows[0].exists

    if (!constraintExists) {
      // Add check constraint for valid cap types
      await pool.query(`
        ALTER TABLE project_quotas
        ADD CONSTRAINT project_quotas_cap_type_check
        CHECK (cap_type IN (
          'db_queries_per_day',
          'realtime_connections',
          'storage_uploads_per_day',
          'function_invocations_per_day'
        ))
      `)

      console.log('[Migration] Added cap_type check constraint')
    }
  } catch (error) {
    console.error('[Migration] Error adding cap_type constraint:', error)
    throw error
  }
}

/**
 * Apply default quotas to a project
 */
export async function applyDefaultQuotas(projectId: string) {
  const pool = getPool()

  try {
    const defaultQuotas = [
      { cap_type: 'db_queries_per_day', cap_value: 10_000 },
      { cap_type: 'realtime_connections', cap_value: 100 },
      { cap_type: 'storage_uploads_per_day', cap_value: 1_000 },
      { cap_type: 'function_invocations_per_day', cap_value: 5_000 },
    ]

    for (const quota of defaultQuotas) {
      await pool.query(
        `
        INSERT INTO project_quotas (project_id, cap_type, cap_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, cap_type) DO NOTHING
        `,
        [projectId, quota.cap_type, quota.cap_value]
      )
    }

    console.log(`[Migration] Applied default quotas to project ${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('[Migration] Error applying default quotas:', error)
    return { success: false, error }
  }
}

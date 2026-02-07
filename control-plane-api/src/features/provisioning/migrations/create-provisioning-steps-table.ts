import { getPool } from '@/lib/db'

/**
 * Create provisioning_steps table
 *
 * This table tracks each provisioning step separately with status,
 * timestamps, and error details for the provisioning state machine.
 *
 * US-001: Create Provisioning Steps Table (from prd-provisioning-state-machine.json)
 */
export async function createProvisioningStepsTable() {
  const pool = getPool()

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'provisioning_steps'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create provisioning_steps table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.provisioning_steps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          step_name VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          error_message TEXT,
          error_details JSONB DEFAULT '{}',
          retry_count INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `)
      console.log('[Migration] Created provisioning_steps table in control_plane schema')
    } else {
      console.log('[Migration] provisioning_steps table already exists')
    }

    // Create status check constraint
    const constraintCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'control_plane'
        AND table_name = 'provisioning_steps'
        AND constraint_name = 'check_provisioning_step_status'
      )
    `)

    if (!constraintCheck.rows[0].exists) {
      await pool.query(`
        ALTER TABLE control_plane.provisioning_steps
        ADD CONSTRAINT check_provisioning_step_status
        CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped'));
      `)
      console.log('[Migration] Created check_provisioning_step_status constraint')
    }

    // Create unique constraint on (project_id, step_name)
    const uniqueCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'control_plane'
        AND table_name = 'provisioning_steps'
        AND constraint_name = 'provisioning_steps_project_id_step_name_unique'
      )
    `)

    if (!uniqueCheck.rows[0].exists) {
      await pool.query(`
        ALTER TABLE control_plane.provisioning_steps
        ADD CONSTRAINT provisioning_steps_project_id_step_name_unique
        UNIQUE (project_id, step_name);
      `)
      console.log('[Migration] Created provisioning_steps_project_id_step_name_unique constraint')
    }

    // Check if indexes exist
    const indexCheck = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'control_plane'
      AND indexname LIKE 'idx_provisioning_steps_%'
    `)

    const existingIndexes = new Set(indexCheck.rows.map((row) => row.indexname))

    // Create index on project_id for efficient queries
    if (!existingIndexes.has('idx_provisioning_steps_project_id')) {
      await pool.query(`
        CREATE INDEX idx_provisioning_steps_project_id
          ON control_plane.provisioning_steps(project_id);
      `)
      console.log('[Migration] Created idx_provisioning_steps_project_id index')
    }

    // Create index on status for filtering
    if (!existingIndexes.has('idx_provisioning_steps_status')) {
      await pool.query(`
        CREATE INDEX idx_provisioning_steps_status
          ON control_plane.provisioning_steps(status);
      `)
      console.log('[Migration] Created idx_provisioning_steps_status index')
    }

    // Create composite index on project_id and status for common queries
    if (!existingIndexes.has('idx_provisioning_steps_project_id_status')) {
      await pool.query(`
        CREATE INDEX idx_provisioning_steps_project_id_status
          ON control_plane.provisioning_steps(project_id, status);
      `)
      console.log('[Migration] Created idx_provisioning_steps_project_id_status index')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.provisioning_steps IS 'Track each provisioning step separately with status and error details';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.id IS 'Unique provisioning step identifier';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.project_id IS 'Reference to the project being provisioned';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.step_name IS 'Name of the provisioning step (e.g., create_database, setup_auth)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.status IS 'Current status: pending, running, success, failed, skipped';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.started_at IS 'When the step started execution';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.completed_at IS 'When the step completed (success or failure)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.error_message IS 'Human-readable error message if step failed';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.error_details IS 'Detailed error information as JSONB (error_type, stack_trace, context)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.retry_count IS 'Number of times this step has been retried';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.provisioning_steps.created_at IS 'When this provisioning step record was created';
    `)

    console.log('[Migration] Added comments to provisioning_steps table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating provisioning_steps table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop provisioning_steps table
 *
 * This function removes the provisioning_steps table if needed for rollback.
 * WARNING: This will cause data loss of all provisioning step records.
 */
export async function dropProvisioningStepsTable() {
  const pool = getPool()

  try {
    // Drop all indexes first
    const indexNames = [
      'idx_provisioning_steps_project_id',
      'idx_provisioning_steps_status',
      'idx_provisioning_steps_project_id_status',
    ]

    for (const indexName of indexNames) {
      await pool.query(`
        DROP INDEX IF EXISTS control_plane.${indexName};
      `)
      console.log(`[Migration] Dropped ${indexName} index`)
    }

    await pool.query(`
      DROP TABLE IF EXISTS control_plane.provisioning_steps;
    `)
    console.log('[Migration] Dropped provisioning_steps table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping provisioning_steps table:', error)
    return { success: false, error }
  }
}

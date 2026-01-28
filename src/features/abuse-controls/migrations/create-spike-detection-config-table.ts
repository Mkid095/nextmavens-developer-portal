import { getPool } from '@/lib/db'

/**
 * Migration: Create spike_detection_config table
 *
 * This table stores per-project spike detection configuration.
 * Allows projects to have custom spike detection thresholds and actions.
 */
export async function createSpikeDetectionConfigTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'spike_detection_config'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the spike_detection_config table
      await pool.query(`
        CREATE TABLE spike_detection_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
          threshold_multiplier DECIMAL(5,2) NOT NULL DEFAULT 3.0 CHECK (threshold_multiplier >= 1.0),
          window_duration_ms BIGINT NOT NULL DEFAULT 3600000 CHECK (window_duration_ms > 0),
          baseline_period_ms BIGINT NOT NULL DEFAULT 86400000 CHECK (baseline_period_ms > 0),
          min_usage_threshold BIGINT NOT NULL DEFAULT 10 CHECK (min_usage_threshold >= 0),
          action VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (action IN ('warning', 'suspension', 'none')),
          enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created spike_detection_config table')

      // Create index on project_id for quick lookups
      await pool.query(`
        CREATE INDEX idx_spike_detection_config_project_id
        ON spike_detection_config(project_id)
      `)

      console.log('[Migration] Created index on spike_detection_config.project_id')

      // Create index on enabled for filtering active configurations
      await pool.query(`
        CREATE INDEX idx_spike_detection_config_enabled
        ON spike_detection_config(enabled) WHERE enabled = true
      `)

      console.log('[Migration] Created index on spike_detection_config.enabled')

      // Create trigger to update updated_at timestamp
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_spike_detection_config_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW()
          RETURN NEW
        END
        $$ LANGUAGE plpgsql
      `)

      await pool.query(`
        CREATE TRIGGER spike_detection_config_updated_at
          BEFORE UPDATE ON spike_detection_config
          FOR EACH ROW
          EXECUTE FUNCTION update_spike_detection_config_updated_at()
      `)

      console.log('[Migration] Created trigger for spike_detection_config.updated_at')
    } else {
      console.log('[Migration] spike_detection_config table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating spike_detection_config table:', error)
    return { success: false, error }
  }
}

/**
 * Get spike detection configuration for a project
 *
 * @param projectId - The project ID
 * @returns The project's spike detection configuration, or null if not set
 */
export async function getSpikeDetectionConfig(
  projectId: string
): Promise<{
  success: boolean
  data: {
    id: string
    project_id: string
    threshold_multiplier: number
    window_duration_ms: number
    baseline_period_ms: number
    min_usage_threshold: number
    action: string
    enabled: boolean
    created_at: Date
    updated_at: Date
  } | null
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        threshold_multiplier,
        window_duration_ms,
        baseline_period_ms,
        min_usage_threshold,
        action,
        enabled,
        created_at,
        updated_at
      FROM spike_detection_config
      WHERE project_id = $1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      return { success: true, data: null }
    }

    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('[Spike Detection Config] Error getting configuration:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Upsert spike detection configuration for a project
 *
 * @param projectId - The project ID
 * @param config - The configuration to set
 * @returns Success status
 */
export async function upsertSpikeDetectionConfig(
  projectId: string,
  config: {
    threshold_multiplier?: number
    window_duration_ms?: number
    baseline_period_ms?: number
    min_usage_threshold?: number
    action?: string
    enabled?: boolean
  }
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO spike_detection_config (
        project_id,
        threshold_multiplier,
        window_duration_ms,
        baseline_period_ms,
        min_usage_threshold,
        action,
        enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (project_id)
      DO UPDATE SET
        threshold_multiplier = COALESCE(EXCLUDED.threshold_multiplier, spike_detection_config.threshold_multiplier),
        window_duration_ms = COALESCE(EXCLUDED.window_duration_ms, spike_detection_config.window_duration_ms),
        baseline_period_ms = COALESCE(EXCLUDED.baseline_period_ms, spike_detection_config.baseline_period_ms),
        min_usage_threshold = COALESCE(EXCLUDED.min_usage_threshold, spike_detection_config.min_usage_threshold),
        action = COALESCE(EXCLUDED.action, spike_detection_config.action),
        enabled = COALESCE(EXCLUDED.enabled, spike_detection_config.enabled),
        updated_at = NOW()
      `,
      [
        projectId,
        config.threshold_multiplier ?? 3.0,
        config.window_duration_ms ?? 3600000,
        config.baseline_period_ms ?? 86400000,
        config.min_usage_threshold ?? 10,
        config.action ?? 'warning',
        config.enabled ?? true,
      ]
    )

    console.log(
      `[Spike Detection Config] Upserted configuration for project ${projectId}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Spike Detection Config] Error upserting configuration:', error)
    return { success: false, error }
  }
}

/**
 * Delete spike detection configuration for a project
 * (This will make the project use default configuration)
 *
 * @param projectId - The project ID
 * @returns Success status
 */
export async function deleteSpikeDetectionConfig(
  projectId: string
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      DELETE FROM spike_detection_config
      WHERE project_id = $1
      `,
      [projectId]
    )

    console.log(
      `[Spike Detection Config] Deleted configuration for project ${projectId}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Spike Detection Config] Error deleting configuration:', error)
    return { success: false, error }
  }
}

/**
 * Get all projects with custom spike detection configurations
 *
 * @returns List of projects with custom configurations
 */
export async function getAllSpikeDetectionConfigs(): Promise<{
  success: boolean
  data?: Array<{
    project_id: string
    threshold_multiplier: number
    window_duration_ms: number
    baseline_period_ms: number
    min_usage_threshold: number
    action: string
    enabled: boolean
  }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        project_id,
        threshold_multiplier,
        window_duration_ms,
        baseline_period_ms,
        min_usage_threshold,
        action,
        enabled
      FROM spike_detection_config
      ORDER BY created_at DESC
      `
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Spike Detection Config] Error getting all configurations:', error)
    return { success: false, error }
  }
}

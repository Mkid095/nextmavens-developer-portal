import { getPool } from '@/lib/db'

/**
 * Migration: Create pattern_detection_config table
 *
 * This table stores per-project pattern detection configuration.
 * Allows projects to have custom pattern detection thresholds and actions.
 */
export async function createPatternDetectionConfigTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pattern_detection_config'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the pattern_detection_config table
      await pool.query(`
        CREATE TABLE pattern_detection_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
          sql_injection_enabled BOOLEAN NOT NULL DEFAULT true,
          sql_injection_min_occurrences BIGINT NOT NULL DEFAULT 3 CHECK (sql_injection_min_occurrences >= 1),
          sql_injection_window_ms BIGINT NOT NULL DEFAULT 3600000 CHECK (sql_injection_window_ms > 0),
          sql_injection_suspend_on_detection BOOLEAN NOT NULL DEFAULT false,
          auth_brute_force_enabled BOOLEAN NOT NULL DEFAULT true,
          auth_brute_force_min_attempts BIGINT NOT NULL DEFAULT 10 CHECK (auth_brute_force_min_attempts >= 1),
          auth_brute_force_window_ms BIGINT NOT NULL DEFAULT 3600000 CHECK (auth_brute_force_window_ms > 0),
          auth_brute_force_suspend_on_detection BOOLEAN NOT NULL DEFAULT false,
          rapid_key_creation_enabled BOOLEAN NOT NULL DEFAULT true,
          rapid_key_creation_min_keys BIGINT NOT NULL DEFAULT 5 CHECK (rapid_key_creation_min_keys >= 1),
          rapid_key_creation_window_ms BIGINT NOT NULL DEFAULT 3600000 CHECK (rapid_key_creation_window_ms > 0),
          rapid_key_creation_suspend_on_detection BOOLEAN NOT NULL DEFAULT false,
          enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created pattern_detection_config table')

      // Create index on project_id for quick lookups
      await pool.query(`
        CREATE INDEX idx_pattern_detection_config_project_id
        ON pattern_detection_config(project_id)
      `)

      console.log('[Migration] Created index on pattern_detection_config.project_id')

      // Create index on enabled for filtering active configurations
      await pool.query(`
        CREATE INDEX idx_pattern_detection_config_enabled
        ON pattern_detection_config(enabled) WHERE enabled = true
      `)

      console.log('[Migration] Created index on pattern_detection_config.enabled')

      // Create trigger to update updated_at timestamp
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_pattern_detection_config_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW()
          RETURN NEW
        END
        $$ LANGUAGE plpgsql
      `)

      await pool.query(`
        CREATE TRIGGER pattern_detection_config_updated_at
          BEFORE UPDATE ON pattern_detection_config
          FOR EACH ROW
          EXECUTE FUNCTION update_pattern_detection_config_updated_at()
      `)

      console.log('[Migration] Created trigger for pattern_detection_config.updated_at')
    } else {
      console.log('[Migration] pattern_detection_config table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating pattern_detection_config table:', error)
    return { success: false, error }
  }
}

/**
 * Get pattern detection configuration for a project
 *
 * @param projectId - The project ID
 * @returns The project's pattern detection configuration, or null if not set
 */
export async function getPatternDetectionConfig(
  projectId: string
): Promise<{
  success: boolean
  data: {
    id: string
    project_id: string
    sql_injection_enabled: boolean
    sql_injection_min_occurrences: number
    sql_injection_window_ms: number
    sql_injection_suspend_on_detection: boolean
    auth_brute_force_enabled: boolean
    auth_brute_force_min_attempts: number
    auth_brute_force_window_ms: number
    auth_brute_force_suspend_on_detection: boolean
    rapid_key_creation_enabled: boolean
    rapid_key_creation_min_keys: number
    rapid_key_creation_window_ms: number
    rapid_key_creation_suspend_on_detection: boolean
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
        sql_injection_enabled,
        sql_injection_min_occurrences,
        sql_injection_window_ms,
        sql_injection_suspend_on_detection,
        auth_brute_force_enabled,
        auth_brute_force_min_attempts,
        auth_brute_force_window_ms,
        auth_brute_force_suspend_on_detection,
        rapid_key_creation_enabled,
        rapid_key_creation_min_keys,
        rapid_key_creation_window_ms,
        rapid_key_creation_suspend_on_detection,
        enabled,
        created_at,
        updated_at
      FROM pattern_detection_config
      WHERE project_id = $1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      return { success: true, data: null }
    }

    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('[Pattern Detection Config] Error getting configuration:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Upsert pattern detection configuration for a project
 *
 * @param projectId - The project ID
 * @param config - The configuration to set
 * @returns Success status
 */
export async function upsertPatternDetectionConfig(
  projectId: string,
  config: {
    sql_injection_enabled?: boolean
    sql_injection_min_occurrences?: number
    sql_injection_window_ms?: number
    sql_injection_suspend_on_detection?: boolean
    auth_brute_force_enabled?: boolean
    auth_brute_force_min_attempts?: number
    auth_brute_force_window_ms?: number
    auth_brute_force_suspend_on_detection?: boolean
    rapid_key_creation_enabled?: boolean
    rapid_key_creation_min_keys?: number
    rapid_key_creation_window_ms?: number
    rapid_key_creation_suspend_on_detection?: boolean
    enabled?: boolean
  }
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO pattern_detection_config (
        project_id,
        sql_injection_enabled,
        sql_injection_min_occurrences,
        sql_injection_window_ms,
        sql_injection_suspend_on_detection,
        auth_brute_force_enabled,
        auth_brute_force_min_attempts,
        auth_brute_force_window_ms,
        auth_brute_force_suspend_on_detection,
        rapid_key_creation_enabled,
        rapid_key_creation_min_keys,
        rapid_key_creation_window_ms,
        rapid_key_creation_suspend_on_detection,
        enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (project_id)
      DO UPDATE SET
        sql_injection_enabled = COALESCE(EXCLUDED.sql_injection_enabled, pattern_detection_config.sql_injection_enabled),
        sql_injection_min_occurrences = COALESCE(EXCLUDED.sql_injection_min_occurrences, pattern_detection_config.sql_injection_min_occurrences),
        sql_injection_window_ms = COALESCE(EXCLUDED.sql_injection_window_ms, pattern_detection_config.sql_injection_window_ms),
        sql_injection_suspend_on_detection = COALESCE(EXCLUDED.sql_injection_suspend_on_detection, pattern_detection_config.sql_injection_suspend_on_detection),
        auth_brute_force_enabled = COALESCE(EXCLUDED.auth_brute_force_enabled, pattern_detection_config.auth_brute_force_enabled),
        auth_brute_force_min_attempts = COALESCE(EXCLUDED.auth_brute_force_min_attempts, pattern_detection_config.auth_brute_force_min_attempts),
        auth_brute_force_window_ms = COALESCE(EXCLUDED.auth_brute_force_window_ms, pattern_detection_config.auth_brute_force_window_ms),
        auth_brute_force_suspend_on_detection = COALESCE(EXCLUDED.auth_brute_force_suspend_on_detection, pattern_detection_config.auth_brute_force_suspend_on_detection),
        rapid_key_creation_enabled = COALESCE(EXCLUDED.rapid_key_creation_enabled, pattern_detection_config.rapid_key_creation_enabled),
        rapid_key_creation_min_keys = COALESCE(EXCLUDED.rapid_key_creation_min_keys, pattern_detection_config.rapid_key_creation_min_keys),
        rapid_key_creation_window_ms = COALESCE(EXCLUDED.rapid_key_creation_window_ms, pattern_detection_config.rapid_key_creation_window_ms),
        rapid_key_creation_suspend_on_detection = COALESCE(EXCLUDED.rapid_key_creation_suspend_on_detection, pattern_detection_config.rapid_key_creation_suspend_on_detection),
        enabled = COALESCE(EXCLUDED.enabled, pattern_detection_config.enabled),
        updated_at = NOW()
      `,
      [
        projectId,
        config.sql_injection_enabled ?? true,
        config.sql_injection_min_occurrences ?? 3,
        config.sql_injection_window_ms ?? 3600000,
        config.sql_injection_suspend_on_detection ?? false,
        config.auth_brute_force_enabled ?? true,
        config.auth_brute_force_min_attempts ?? 10,
        config.auth_brute_force_window_ms ?? 3600000,
        config.auth_brute_force_suspend_on_detection ?? false,
        config.rapid_key_creation_enabled ?? true,
        config.rapid_key_creation_min_keys ?? 5,
        config.rapid_key_creation_window_ms ?? 3600000,
        config.rapid_key_creation_suspend_on_detection ?? false,
        config.enabled ?? true,
      ]
    )

    console.log(
      `[Pattern Detection Config] Upserted configuration for project ${projectId}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Pattern Detection Config] Error upserting configuration:', error)
    return { success: false, error }
  }
}

/**
 * Delete pattern detection configuration for a project
 * (This will make the project use default configuration)
 *
 * @param projectId - The project ID
 * @returns Success status
 */
export async function deletePatternDetectionConfig(
  projectId: string
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      DELETE FROM pattern_detection_config
      WHERE project_id = $1
      `,
      [projectId]
    )

    console.log(
      `[Pattern Detection Config] Deleted configuration for project ${projectId}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Pattern Detection Config] Error deleting configuration:', error)
    return { success: false, error }
  }
}

/**
 * Get all projects with custom pattern detection configurations
 *
 * @returns List of projects with custom configurations
 */
export async function getAllPatternDetectionConfigs(): Promise<{
  success: boolean
  data?: Array<{
    project_id: string
    sql_injection_enabled: boolean
    sql_injection_min_occurrences: number
    sql_injection_window_ms: number
    sql_injection_suspend_on_detection: boolean
    auth_brute_force_enabled: boolean
    auth_brute_force_min_attempts: number
    auth_brute_force_window_ms: number
    auth_brute_force_suspend_on_detection: boolean
    rapid_key_creation_enabled: boolean
    rapid_key_creation_min_keys: number
    rapid_key_creation_window_ms: number
    rapid_key_creation_suspend_on_detection: boolean
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
        sql_injection_enabled,
        sql_injection_min_occurrences,
        sql_injection_window_ms,
        sql_injection_suspend_on_detection,
        auth_brute_force_enabled,
        auth_brute_force_min_attempts,
        auth_brute_force_window_ms,
        auth_brute_force_suspend_on_detection,
        rapid_key_creation_enabled,
        rapid_key_creation_min_keys,
        rapid_key_creation_window_ms,
        rapid_key_creation_suspend_on_detection,
        enabled
      FROM pattern_detection_config
      ORDER BY created_at DESC
      `
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Pattern Detection Config] Error getting all configurations:', error)
    return { success: false, error }
  }
}

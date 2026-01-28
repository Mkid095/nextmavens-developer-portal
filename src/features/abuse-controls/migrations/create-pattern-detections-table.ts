import { getPool } from '@/lib/db'
import type { Pool } from 'pg'

/**
 * Migration: Create pattern_detections table
 *
 * This table logs all detected malicious patterns for audit and analysis.
 * Each record represents a detected pattern with details about the detection.
 */
export async function createPatternDetectionsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pattern_detections'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the pattern_detections table
      await pool.query(`
        CREATE TABLE pattern_detections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          pattern_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical', 'severe')),
          occurrence_count BIGINT NOT NULL CHECK (occurrence_count >= 0),
          detection_window_ms BIGINT NOT NULL CHECK (detection_window_ms > 0),
          description TEXT NOT NULL,
          evidence TEXT[],
          action_taken VARCHAR(20) NOT NULL CHECK (action_taken IN ('none', 'warning', 'suspension')),
          detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created pattern_detections table')

      // Create index on project_id for project-specific queries
      await pool.query(`
        CREATE INDEX idx_pattern_detections_project_id
        ON pattern_detections(project_id)
      `)

      console.log('[Migration] Created index on pattern_detections.project_id')

      // Create composite index for time-series queries
      await pool.query(`
        CREATE INDEX idx_pattern_detections_project_pattern_time
        ON pattern_detections(project_id, pattern_type, detected_at DESC)
      `)

      console.log('[Migration] Created composite index on (project_id, pattern_type, detected_at)')

      // Create index on detected_at for time-range queries
      await pool.query(`
        CREATE INDEX idx_pattern_detections_detected_at
        ON pattern_detections(detected_at DESC)
      `)

      console.log('[Migration] Created index on pattern_detections.detected_at')

      // Create index on severity for filtering by severity level
      await pool.query(`
        CREATE INDEX idx_pattern_detections_severity
        ON pattern_detections(severity)
      `)

      console.log('[Migration] Created index on pattern_detections.severity')

      // Create index on action_taken for filtering by action type
      await pool.query(`
        CREATE INDEX idx_pattern_detections_action_taken
        ON pattern_detections(action_taken)
      `)

      console.log('[Migration] Created index on pattern_detections.action_taken')

      // Create index on pattern_type for filtering by pattern type
      await pool.query(`
        CREATE INDEX idx_pattern_detections_pattern_type
        ON pattern_detections(pattern_type)
      `)

      console.log('[Migration] Created index on pattern_detections.pattern_type')

      // Ensure pattern_type has proper check constraints
      await ensurePatternTypeCheck(pool)
    } else {
      console.log('[Migration] pattern_detections table already exists')

      // Ensure check constraint exists even if table does
      await ensurePatternTypeCheck(pool)
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating pattern_detections table:', error)
    return { success: false, error }
  }
}

/**
 * Ensure pattern_type has proper check constraints
 */
async function ensurePatternTypeCheck(pool: Pool) {
  try {
    // Check if check constraint exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = 'pattern_detections_pattern_type_check'
      )
    `)

    const constraintExists = checkResult.rows[0].exists

    if (!constraintExists) {
      // Add check constraint for valid pattern types
      await pool.query(`
        ALTER TABLE pattern_detections
        ADD CONSTRAINT pattern_detections_pattern_type_check
        CHECK (pattern_type IN (
          'sql_injection',
          'auth_brute_force',
          'rapid_key_creation'
        ))
      `)

      console.log('[Migration] Added pattern_type check constraint')
    }
  } catch (error) {
    console.error('[Migration] Error adding pattern_type constraint:', error)
    throw error
  }
}

/**
 * Log a detected pattern
 *
 * @param projectId - The project ID
 * @param patternType - The type of pattern detected
 * @param severity - The severity level
 * @param occurrenceCount - Number of occurrences
 * @param detectionWindowMs - Detection window in milliseconds
 * @param description - Description of the detection
 * @param evidence - Evidence/context of the pattern
 * @param actionTaken - The action that was taken
 */
export async function logPatternDetection(
  projectId: string,
  patternType: string,
  severity: string,
  occurrenceCount: number,
  detectionWindowMs: number,
  description: string,
  evidence: string[] | undefined,
  actionTaken: string
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO pattern_detections (
        project_id,
        pattern_type,
        severity,
        occurrence_count,
        detection_window_ms,
        description,
        evidence,
        action_taken
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        projectId,
        patternType,
        severity,
        occurrenceCount,
        detectionWindowMs,
        description,
        evidence,
        actionTaken,
      ]
    )

    console.log(
      `[Pattern Detection] Logged pattern for project ${projectId}: ${patternType} - ${occurrenceCount} occurrence(s) - Severity: ${severity}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Pattern Detection] Error logging pattern:', error)
    return { success: false, error }
  }
}

/**
 * Get pattern detections for a project within a time range
 *
 * @param projectId - The project ID
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getPatternDetections(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    project_id: string
    pattern_type: string
    severity: string
    occurrence_count: number
    detection_window_ms: number
    description: string
    evidence: string[] | null
    action_taken: string
    detected_at: Date
  }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        pattern_type,
        severity,
        occurrence_count,
        detection_window_ms,
        description,
        evidence,
        action_taken,
        detected_at
      FROM pattern_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      ORDER BY detected_at DESC
      `,
      [projectId, startTime, endTime]
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Pattern Detection] Error querying detections:', error)
    return { success: false, error }
  }
}

/**
 * Get recent pattern detections across all projects
 *
 * @param limit - Maximum number of records to return
 * @param patternType - Optional pattern type filter
 * @param severity - Optional severity filter
 */
export async function getRecentPatternDetections(
  limit: number = 100,
  patternType?: string,
  severity?: string
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    project_id: string
    pattern_type: string
    severity: string
    occurrence_count: number
    detection_window_ms: number
    description: string
    evidence: string[] | null
    action_taken: string
    detected_at: Date
  }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    let query = `
      SELECT
        id,
        project_id,
        pattern_type,
        severity,
        occurrence_count,
        detection_window_ms,
        description,
        evidence,
        action_taken,
        detected_at
      FROM pattern_detections
    `

    const params: (string | number)[] = []
    let paramCount = 0

    const conditions: string[] = []

    if (patternType) {
      paramCount++
      conditions.push(`pattern_type = $${paramCount}`)
      params.push(patternType)
    }

    if (severity) {
      paramCount++
      conditions.push(`severity = $${paramCount}`)
      params.push(severity)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY detected_at DESC LIMIT $${paramCount + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Pattern Detection] Error querying recent detections:', error)
    return { success: false, error }
  }
}

/**
 * Get pattern detection statistics for a project
 *
 * @param projectId - The project ID
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getPatternDetectionStatistics(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: {
    total_detections: number
    by_pattern_type: {
      sql_injection: number
      auth_brute_force: number
      rapid_key_creation: number
    }
    by_severity: { warning: number; critical: number; severe: number }
    by_action: { none: number; warning: number; suspension: number }
  }
  error?: unknown
}> {
  const pool = getPool()

  try {
    // Get total detections
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM pattern_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      `,
      [projectId, startTime, endTime]
    )

    // Get by pattern type
    const patternResult = await pool.query(
      `
      SELECT pattern_type, COUNT(*) as count
      FROM pattern_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      GROUP BY pattern_type
      `,
      [projectId, startTime, endTime]
    )

    // Get by severity
    const severityResult = await pool.query(
      `
      SELECT severity, COUNT(*) as count
      FROM pattern_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      GROUP BY severity
      `,
      [projectId, startTime, endTime]
    )

    // Get by action taken
    const actionResult = await pool.query(
      `
      SELECT action_taken, COUNT(*) as count
      FROM pattern_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      GROUP BY action_taken
      `,
      [projectId, startTime, endTime]
    )

    // Process results
    const byPatternType = {
      sql_injection: 0,
      auth_brute_force: 0,
      rapid_key_creation: 0,
    }
    patternResult.rows.forEach((row: { pattern_type: string; count: number }) => {
      if (row.pattern_type in byPatternType) {
        byPatternType[row.pattern_type as keyof typeof byPatternType] = row.count
      }
    })

    const bySeverity = { warning: 0, critical: 0, severe: 0 }
    severityResult.rows.forEach((row: { severity: string; count: number }) => {
      bySeverity[row.severity as keyof typeof bySeverity] = row.count
    })

    const byAction = { none: 0, warning: 0, suspension: 0 }
    actionResult.rows.forEach((row: { action_taken: string; count: number }) => {
      byAction[row.action_taken as keyof typeof byAction] = row.count
    })

    return {
      success: true,
      data: {
        total_detections: parseInt(totalResult.rows[0].count),
        by_pattern_type: byPatternType,
        by_severity: bySeverity,
        by_action: byAction,
      },
    }
  } catch (error) {
    console.error('[Pattern Detection] Error calculating statistics:', error)
    return { success: false, error }
  }
}

/**
 * Clean up old pattern detection records to prevent table bloat
 *
 * @param retentionDays - Number of days to retain records (default: 90)
 */
export async function cleanupOldPatternDetections(retentionDays: number = 90): Promise<{
  success: boolean
  deletedCount?: number
  error?: unknown
}> {
  const pool = getPool()

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await pool.query(
      `
      DELETE FROM pattern_detections
      WHERE detected_at < $1
      `,
      [cutoffDate]
    )

    const deletedCount = result.rowCount || 0

    console.log(
      `[Pattern Detection] Cleaned up ${deletedCount} old detection records (older than ${retentionDays} days)`
    )

    return { success: true, deletedCount }
  } catch (error) {
    console.error('[Pattern Detection] Error cleaning up old detections:', error)
    return { success: false, error }
  }
}

/**
 * Abuse Dashboard Queries Module - Pattern Detections Queries
 */

import { getPool } from '@/lib/db'
import type { PatternsStats, PatternDetection } from '../../types'
import { SQL_QUERIES, ERROR_MESSAGES, EMPTY_RESULTS, DEFAULT_LIMITS } from '../constants'
import { reducePatternTypesByType, reducePatternsBySeverity, withErrorHandling, safeParseInt } from '../utils'

/**
 * Get total pattern detections in time range
 */
async function getTotalPatternDetections(startTime: Date, endTime: Date): Promise<number> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.PATTERNS_TOTAL({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return parseInt(result.rows[0].count)
}

/**
 * Get patterns grouped by type
 */
async function getPatternsByType(
  startTime: Date,
  endTime: Date
): Promise<Record<string, number>> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.PATTERNS_BY_TYPE({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return reducePatternTypesByType(result.rows)
}

/**
 * Get patterns grouped by severity
 */
async function getPatternsBySeverity(
  startTime: Date,
  endTime: Date
): Promise<Record<string, number>> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.PATTERNS_BY_SEVERITY({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return reducePatternsBySeverity(result.rows)
}

/**
 * Get recent pattern detections
 */
async function getRecentPatternDetections(
  startTime: Date,
  endTime: Date
): Promise<PatternDetection[]> {
  const pool = getPool()
  const result = await pool.query(
    SQL_QUERIES.PATTERNS_RECENT({ startTime, endTime }, DEFAULT_LIMITS.RECENT_PATTERNS),
    [startTime, endTime]
  )

  return result.rows.map((row) => ({
    project_id: row.project_id,
    project_name: row.project_name,
    organization: row.organization,
    pattern_type: row.pattern_type,
    severity: row.severity,
    occurrence_count: safeParseInt(row.occurrence_count),
    description: row.description,
    detected_at: row.detected_at,
  }))
}

/**
 * Get suspicious pattern statistics
 */
export async function getPatternsStats(startTime: Date, endTime: Date): Promise<PatternsStats> {
  return withErrorHandling(
    async () => {
      const [total, by_type, by_severity, recent] = await Promise.all([
        getTotalPatternDetections(startTime, endTime),
        getPatternsByType(startTime, endTime),
        getPatternsBySeverity(startTime, endTime),
        getRecentPatternDetections(startTime, endTime),
      ])

      return { total, by_type, by_severity, recent }
    },
    ERROR_MESSAGES.PATTERNS_STATS,
    EMPTY_RESULTS.PATTERNS_STATS
  )
}

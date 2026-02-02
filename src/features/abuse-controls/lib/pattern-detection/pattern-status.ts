/**
 * Pattern Detection Status Module
 * Functions for getting pattern detection status and summaries
 */

import { getPool } from '@/lib/db'
import { DEFAULT_PATTERN_DETECTION_CONFIG } from '../config'
import { checkProjectForMaliciousPatterns } from './pattern-checker'

/**
 * Get pattern detection configuration
 *
 * @returns Current pattern detection configuration
 */
export function getPatternDetectionConfig(): {
  sql_injection: {
    enabled: boolean
    min_occurrences: number
    detection_window_ms: number
    suspend_on_detection: boolean
  }
  auth_brute_force: {
    enabled: boolean
    min_failed_attempts: number
    detection_window_ms: number
    suspend_on_detection: boolean
  }
  rapid_key_creation: {
    enabled: boolean
    min_keys_created: number
    detection_window_ms: number
    suspend_on_detection: boolean
  }
} {
  return {
    sql_injection: {
      ...DEFAULT_PATTERN_DETECTION_CONFIG.sql_injection,
    },
    auth_brute_force: {
      ...DEFAULT_PATTERN_DETECTION_CONFIG.auth_brute_force,
    },
    rapid_key_creation: {
      ...DEFAULT_PATTERN_DETECTION_CONFIG.rapid_key_creation,
    },
  }
}

/**
 * Check a specific project for malicious patterns
 *
 * @param projectId - The project to check
 * @returns Array of detected patterns (empty if none)
 */
export async function checkProjectPatternStatus(
  projectId: string
) {
  return checkProjectForMaliciousPatterns(projectId)
}

/**
 * Get current pattern detection status for all projects
 *
 * @returns Summary of pattern detection status across all projects
 */
export async function getPatternDetectionSummary(): Promise<{
  total_projects: number
  active_detections: number
  recent_suspensions: number
  by_pattern_type: {
    sql_injection: number
    auth_brute_force: number
    rapid_key_creation: number
  }
  by_severity: Record<string, number>
}> {
  const pool = getPool()

  try {
    // Get total active projects
    const projectsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'active'
      `
    )
    const total_projects = parseInt(projectsResult.rows[0].count)

    // Note: These will be populated when we implement the pattern_detections table
    const active_detections = 0
    const recent_suspensions = 0
    const by_pattern_type = {
      sql_injection: 0,
      auth_brute_force: 0,
      rapid_key_creation: 0,
    }
    const by_severity: Record<string, number> = {
      warning: 0,
      critical: 0,
      severe: 0,
    }

    return {
      total_projects,
      active_detections,
      recent_suspensions,
      by_pattern_type,
      by_severity,
    }
  } catch (error) {
    console.error('[Pattern Detection] Error getting summary:', error)
    return {
      total_projects: 0,
      active_detections: 0,
      recent_suspensions: 0,
      by_pattern_type: {
        sql_injection: 0,
        auth_brute_force: 0,
        rapid_key_creation: 0,
      },
      by_severity: {},
    }
  }
}

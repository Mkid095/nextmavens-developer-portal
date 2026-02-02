/**
 * Pattern Detection Manager - Main interface for malicious pattern detection operations
 */

import {
  checkProjectForMaliciousPatterns,
  checkAllProjectsForMaliciousPatterns,
  runPatternDetection,
  getPatternDetectionConfig,
  getPatternDetectionSummary,
} from '../pattern-detection'
import { logPatternDetection, getPatternDetections, getPatternDetectionStatistics } from '../../migrations/create-pattern-detections-table'
import { getPatternDetectionConfig as getPatternDetectionConfigFromDb } from '../../migrations/create-pattern-detection-config-table'
import type { PatternDetectionResult, PatternDetectionJobResult } from '../../types'

/**
 * Pattern Detection Manager - Main interface for malicious pattern detection operations
 */
export class PatternDetectionManager {
  /**
   * Check a single project for all malicious patterns
   */
  static async checkProject(projectId: string): Promise<PatternDetectionResult[]> {
    return checkProjectForMaliciousPatterns(projectId)
  }

  /**
   * Check all projects for malicious patterns
   */
  static async checkAllProjects(): Promise<PatternDetectionResult[]> {
    return checkAllProjectsForMaliciousPatterns()
  }

  /**
   * Run the pattern detection background job
   */
  static async runBackgroundJob(): Promise<PatternDetectionJobResult> {
    return runPatternDetection()
  }

  /**
   * Get pattern detection configuration
   */
  static async getConfig(): Promise<{
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
  }> {
    return getPatternDetectionConfig()
  }

  /**
   * Get pattern detection history for a project
   */
  static async getHistory(
    projectId: string,
    hours: number = 24
  ): Promise<PatternDetectionResult[]> {
    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const result = await getPatternDetections(projectId, startTime, now)

    if (!result.success || !result.data) {
      return []
    }

    return result.data.map((row) => ({
      project_id: row.project_id,
      pattern_type: row.pattern_type as any,
      severity: row.severity as any,
      occurrence_count: row.occurrence_count,
      detection_window_ms: row.detection_window_ms,
      detected_at: row.detected_at,
      description: row.description,
      evidence: row.evidence || undefined,
      action_taken: row.action_taken as any,
    }))
  }

  /**
   * Get pattern detection statistics for a project
   */
  static async getStatistics(
    projectId: string,
    hours: number = 24
  ): Promise<{
    total_detections: number
    by_pattern_type: {
      sql_injection: number
      auth_brute_force: number
      rapid_key_creation: number
    }
    by_severity: { warning: number; critical: number; severe: number }
    by_action: { none: number; warning: number; suspension: number }
  } | null> {
    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const result = await getPatternDetectionStatistics(projectId, startTime, now)

    if (!result.success || !result.data) {
      return null
    }

    return result.data
  }

  /**
   * Record a pattern detection result
   */
  static async recordDetection(
    projectId: string,
    patternType: string,
    severity: string,
    occurrenceCount: number,
    detectionWindowMs: number,
    description: string,
    evidence: string[] | undefined,
    actionTaken: string
  ): Promise<boolean> {
    const result = await logPatternDetection(
      projectId,
      patternType,
      severity,
      occurrenceCount,
      detectionWindowMs,
      description,
      evidence,
      actionTaken
    )

    return result.success
  }

  /**
   * Get pattern detection summary across all projects
   */
  static async getSummary(): Promise<{
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
    return getPatternDetectionSummary()
  }

  /**
   * Check a specific project's current pattern status
   */
  static async checkCurrentStatus(projectId: string): Promise<PatternDetectionResult[]> {
    return checkProjectForMaliciousPatterns(projectId)
  }

  /**
   * Get project's pattern detection configuration from database
   */
  static async getProjectConfig(projectId: string): Promise<{
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
    return getPatternDetectionConfigFromDb(projectId)
  }
}

/**
 * Pattern Detection Background Job Module
 * Main background job for running pattern detection
 */

import { getPool } from '@/lib/db'
import type { PatternDetectionJobResult, PatternDetectionResult } from '../../types'
import { MaliciousPatternType } from '../../types'
import { logBackgroundJob } from '../audit-logger'
import { checkAllProjectsForMaliciousPatterns } from './pattern-checker'
import { processPatternDetections } from './pattern-processor'

/**
 * Run the malicious pattern detection background job
 *
 * This function checks all active projects for malicious patterns
 * and triggers suspensions when CRITICAL or SEVERE patterns are detected.
 *
 * @returns Result object with job statistics and detected patterns
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runPatternDetection();
 * console.log(`Job completed: ${result.patterns_detected} patterns detected`);
 */
export async function runPatternDetection(): Promise<PatternDetectionJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Pattern Detection] Background job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Run the pattern detection
    const detectedPatterns = await checkAllProjectsForMaliciousPatterns()

    // Process detections - log to database and trigger suspensions
    await processPatternDetections(detectedPatterns)

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    // Count actions taken
    const warnings = detectedPatterns.filter((p) => p.action_taken === 'warning').length
    const suspensions = detectedPatterns.filter((p) => p.action_taken === 'suspension').length

    // Count projects checked
    const pool = getPool()
    const projectsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'active'
      `
    )
    const projectsChecked = parseInt(projectsResult.rows[0].count)

    // Count patterns by type
    const patternsByType = {
      sql_injection: detectedPatterns.filter(p => p.pattern_type === MaliciousPatternType.SQL_INJECTION).length,
      auth_brute_force: detectedPatterns.filter(p => p.pattern_type === MaliciousPatternType.AUTH_BRUTE_FORCE).length,
      rapid_key_creation: detectedPatterns.filter(p => p.pattern_type === MaliciousPatternType.RAPID_KEY_CREATION).length,
    }

    const result: PatternDetectionJobResult = {
      success: true,
      started_at: startTime,
      completed_at: endTime,
      duration_ms: durationMs,
      projects_checked: projectsChecked,
      patterns_detected: detectedPatterns.length,
      detected_patterns: detectedPatterns,
      patterns_by_type: patternsByType,
      actions_taken: {
        warnings,
        suspensions,
      },
    }

    // Log summary
    console.log('='.repeat(60))
    console.log(`[Pattern Detection] Background job completed`)
    console.log(`[Pattern Detection] Duration: ${durationMs}ms`)
    console.log(`[Pattern Detection] Projects checked: ${result.projects_checked}`)
    console.log(`[Pattern Detection] Patterns detected: ${result.patterns_detected}`)
    console.log(`[Pattern Detection] Patterns by type:`)
    console.log(`  - SQL Injection: ${result.patterns_by_type.sql_injection}`)
    console.log(`  - Auth Brute Force: ${result.patterns_by_type.auth_brute_force}`)
    console.log(`  - Rapid Key Creation: ${result.patterns_by_type.rapid_key_creation}`)
    console.log(`[Pattern Detection] Actions recommended:`)
    console.log(`  - Warnings: ${result.actions_taken.warnings}`)
    console.log(`  - Suspensions: ${result.actions_taken.suspensions}`)

    if (result.patterns_detected > 0) {
      console.log(`[Pattern Detection] Detected patterns:`)
      detectedPatterns.forEach((detection, index) => {
        console.log(
          `  ${index + 1}. Project ${detection.project_id} - ${detection.pattern_type} - ` +
          `${detection.occurrence_count} occurrence(s) - Severity: ${detection.severity.toUpperCase()}`
        )
      })
    }

    console.log('='.repeat(60))

    // Log the background job execution to audit logs
    await logBackgroundJob(
      'pattern_detection',
      true,
      {
        duration_ms: durationMs,
        projects_checked: result.projects_checked,
        patterns_detected: result.patterns_detected,
        patterns_by_type: patternsByType,
        warnings: result.actions_taken.warnings,
        suspensions: result.actions_taken.suspensions,
        detected_patterns: detectedPatterns.map((p) => ({
          project_id: p.project_id,
          pattern_type: p.pattern_type,
          severity: p.severity,
          occurrence_count: p.occurrence_count,
        })),
      }
    ).catch((error) => {
      // Don't fail the job if logging fails
      console.error('[Pattern Detection] Failed to log to audit:', error)
    })

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Pattern Detection] Background job failed`)
    console.error(`[Pattern Detection] Duration: ${durationMs}ms`)
    console.error(`[Pattern Detection] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    // Log the failed background job execution to audit logs
    await logBackgroundJob(
      'pattern_detection',
      false,
      {
        duration_ms: durationMs,
        error: errorMessage,
      }
    ).catch((logError) => {
      // Don't fail if logging fails
      console.error('[Pattern Detection] Failed to log to audit:', logError)
    })

    return {
      success: false,
      started_at: startTime,
      completed_at: endTime,
      duration_ms: durationMs,
      projects_checked: 0,
      patterns_detected: 0,
      detected_patterns: [],
      patterns_by_type: {
        sql_injection: 0,
        auth_brute_force: 0,
        rapid_key_creation: 0,
      },
      actions_taken: {
        warnings: 0,
        suspensions: 0,
      },
      error: errorMessage,
    }
  }
}

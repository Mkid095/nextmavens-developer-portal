/**
 * Malicious Pattern Detection Library
 *
 * Detects sophisticated abuse patterns including:
 * - SQL injection attempts
 * - Authentication brute force attacks
 * - Rapid sequential API key creation
 *
 * Usage:
 * - Call runPatternDetection() from a background job (e.g., every hour)
 * - The function will check all projects for malicious patterns
 * - Actions are taken based on pattern severity (warning or suspension)
 *
 * This is a foundational implementation. Integration with actual data sources
 * (auth logs, query logs, key creation logs) will be added in subsequent steps.
 */

import { getPool } from '@/lib/db'
import {
  MaliciousPatternType,
  PatternSeverity,
  PatternDetectionResult,
  PatternMatchResult,
  PatternDetectionJobResult,
} from '../types'
import {
  SQL_INJECTION_PATTERNS,
  DEFAULT_PATTERN_DETECTION_CONFIG,
  determinePatternAction,
} from './config'
import { logBackgroundJob } from './audit-logger'
import { suspendProject } from './suspensions'
import { logPatternDetection } from '../migrations/create-pattern-detections-table'
import { HardCapType } from '../types'

/**
 * Check if input contains SQL injection patterns
 *
 * @param input - The input string to check (e.g., query string, user input)
 * @returns Pattern match result with details
 */
export function detectSQLInjection(input: string): PatternMatchResult {
  if (!input || typeof input !== 'string') {
    return { matched: false, confidence: 0 }
  }

  const evidence: string[] = []
  let maxConfidence = 0
  let matchedPattern: typeof SQL_INJECTION_PATTERNS[0] | null = null

  // Check against each SQL injection pattern
  for (const patternConfig of SQL_INJECTION_PATTERNS) {
    if (patternConfig.pattern.test(input)) {
      evidence.push(patternConfig.description)

      // Assign confidence based on severity
      const confidence = patternConfig.severity === 'severe' ? 0.95 :
                        patternConfig.severity === 'critical' ? 0.8 : 0.6

      if (confidence > maxConfidence) {
        maxConfidence = confidence
        matchedPattern = patternConfig
      }
    }
  }

  return {
    matched: maxConfidence > 0,
    confidence: maxConfidence,
    details: matchedPattern?.description,
    evidence: evidence.length > 0 ? evidence : undefined,
  }
}

/**
 * Analyze SQL injection occurrences for a project
 *
 * Note: This is a placeholder implementation. In a full implementation,
 * this would query actual query logs or request logs to detect patterns.
 *
 * @param projectId - The project to analyze
 * @param startTime - Start of time window
 * @param endTime - End of time window
 * @returns Array of detected SQL injection attempts
 */
export async function analyzeSQLInjectionPatterns(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<PatternMatchResult[]> {
  // Placeholder: In full implementation, this would:
  // 1. Query request logs or query logs for the project
  // 2. Analyze each query/request for SQL injection patterns
  // 3. Return all matches with confidence scores

  console.log(
    `[Pattern Detection] Analyzing SQL injection patterns for project ${projectId} ` +
    `from ${startTime.toISOString()} to ${endTime.toISOString()}`
  )

  // Return empty array for now - will be implemented with actual data sources
  return []
}

/**
 * Analyze authentication brute force patterns for a project
 *
 * Note: This is a placeholder implementation. In a full implementation,
 * this would query actual authentication logs to detect failed attempts.
 *
 * @param projectId - The project to analyze
 * @param startTime - Start of time window
 * @param endTime - End of time window
 * @returns Number of failed authentication attempts
 */
export async function analyzeAuthBruteForcePatterns(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{ failedAttempts: number; uniqueIps: Set<string> }> {
  // Placeholder: In full implementation, this would:
  // 1. Query authentication logs for the project
  // 2. Count failed login attempts in the time window
  // 3. Track unique IPs to detect distributed brute force
  // 4. Return statistics

  console.log(
    `[Pattern Detection] Analyzing auth brute force patterns for project ${projectId} ` +
    `from ${startTime.toISOString()} to ${endTime.toISOString()}`
  )

  // Return empty result for now - will be implemented with actual auth logs
  return { failedAttempts: 0, uniqueIps: new Set<string>() }
}

/**
 * Analyze rapid API key creation patterns for a project
 *
 * Note: This is a placeholder implementation. In a full implementation,
 * this would query actual API key creation logs.
 *
 * @param projectId - The project to analyze
 * @param startTime - Start of time window
 * @param endTime - End of time window
 * @returns Number of keys created in the time window
 */
export async function analyzeRapidKeyCreationPatterns(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  // Placeholder: In full implementation, this would:
  // 1. Query API key creation logs for the project
  // 2. Count keys created in the time window
  // 3. Return the count

  console.log(
    `[Pattern Detection] Analyzing rapid key creation patterns for project ${projectId} ` +
    `from ${startTime.toISOString()} to ${endTime.toISOString()}`
  )

  // Return 0 for now - will be implemented with actual key creation logs
  return 0
}

/**
 * Detect SQL injection pattern for a project
 *
 * @param projectId - The project to check
 * @returns Pattern detection result or null if no pattern detected
 */
export async function detectSQLInjectionForProject(
  projectId: string
): Promise<PatternDetectionResult | null> {
  const config = DEFAULT_PATTERN_DETECTION_CONFIG.sql_injection

  if (!config.enabled) {
    return null
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - config.detection_window_ms)

  // Analyze SQL injection patterns
  const matches = await analyzeSQLInjectionPatterns(projectId, windowStart, now)

  if (matches.length < config.min_occurrences) {
    return null
  }

  // Determine severity based on match count and confidence
  const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length

  const severity = avgConfidence >= 0.9 ? PatternSeverity.SEVERE :
                  avgConfidence >= 0.7 ? PatternSeverity.CRITICAL :
                  PatternSeverity.WARNING

  // Determine action based on severity and occurrences
  const actionValue = determinePatternAction(
    severity as 'warning' | 'critical' | 'severe',
    matches.length
  )

  const actionTaken = actionValue === 'suspension' ? 'suspension' :
                     actionValue === 'warning' ? 'warning' : 'none'

  // Gather evidence from all matches
  const allEvidence = matches.flatMap(m => m.evidence || [])

  return {
    project_id: projectId,
    pattern_type: MaliciousPatternType.SQL_INJECTION,
    severity,
    occurrence_count: matches.length,
    detection_window_ms: config.detection_window_ms,
    detected_at: now,
    description: `Detected ${matches.length} potential SQL injection attempt(s) in the last ${config.detection_window_ms / 60000} minutes`,
    evidence: allEvidence.length > 0 ? allEvidence.slice(0, 10) : undefined,
    action_taken: actionTaken,
  }
}

/**
 * Detect auth brute force pattern for a project
 *
 * @param projectId - The project to check
 * @returns Pattern detection result or null if no pattern detected
 */
export async function detectAuthBruteForceForProject(
  projectId: string
): Promise<PatternDetectionResult | null> {
  const config = DEFAULT_PATTERN_DETECTION_CONFIG.auth_brute_force

  if (!config.enabled) {
    return null
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - config.detection_window_ms)

  // Analyze auth brute force patterns
  const { failedAttempts, uniqueIps } = await analyzeAuthBruteForcePatterns(
    projectId,
    windowStart,
    now
  )

  if (failedAttempts < config.min_failed_attempts) {
    return null
  }

  // Determine severity based on failed attempts
  const severity = failedAttempts >= 50 ? PatternSeverity.SEVERE :
                  failedAttempts >= 25 ? PatternSeverity.CRITICAL :
                  PatternSeverity.WARNING

  // Determine action based on severity and occurrences
  const actionValue = determinePatternAction(
    severity as 'warning' | 'critical' | 'severe',
    failedAttempts
  )

  const actionTaken = actionValue === 'suspension' ? 'suspension' :
                     actionValue === 'warning' ? 'warning' : 'none'

  return {
    project_id: projectId,
    pattern_type: MaliciousPatternType.AUTH_BRUTE_FORCE,
    severity,
    occurrence_count: failedAttempts,
    detection_window_ms: config.detection_window_ms,
    detected_at: now,
    description: `Detected ${failedAttempts} failed authentication attempt(s) from ${uniqueIps.size} unique IP(s) in the last ${config.detection_window_ms / 60000} minutes`,
    evidence: uniqueIps.size > 0 ? Array.from(uniqueIps).slice(0, 10) : undefined,
    action_taken: actionTaken,
  }
}

/**
 * Detect rapid key creation pattern for a project
 *
 * @param projectId - The project to check
 * @returns Pattern detection result or null if no pattern detected
 */
export async function detectRapidKeyCreationForProject(
  projectId: string
): Promise<PatternDetectionResult | null> {
  const config = DEFAULT_PATTERN_DETECTION_CONFIG.rapid_key_creation

  if (!config.enabled) {
    return null
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - config.detection_window_ms)

  // Analyze rapid key creation patterns
  const keysCreated = await analyzeRapidKeyCreationPatterns(
    projectId,
    windowStart,
    now
  )

  if (keysCreated < config.min_keys_created) {
    return null
  }

  // Determine severity based on number of keys created
  const severity = keysCreated >= 20 ? PatternSeverity.SEVERE :
                  keysCreated >= 10 ? PatternSeverity.CRITICAL :
                  PatternSeverity.WARNING

  // Determine action based on severity and occurrences
  const actionValue = determinePatternAction(
    severity as 'warning' | 'critical' | 'severe',
    keysCreated
  )

  const actionTaken = actionValue === 'suspension' ? 'suspension' :
                     actionValue === 'warning' ? 'warning' : 'none'

  return {
    project_id: projectId,
    pattern_type: MaliciousPatternType.RAPID_KEY_CREATION,
    severity,
    occurrence_count: keysCreated,
    detection_window_ms: config.detection_window_ms,
    detected_at: now,
    description: `Detected ${keysCreated} API key(s) created in ${config.detection_window_ms / 60000} minutes`,
    action_taken: actionTaken,
  }
}

/**
 * Check a single project for all malicious patterns
 *
 * @param projectId - The project to check
 * @returns Array of pattern detection results
 */
export async function checkProjectForMaliciousPatterns(
  projectId: string
): Promise<PatternDetectionResult[]> {
  const detectedPatterns: PatternDetectionResult[] = []

  try {
    // Check for SQL injection patterns
    const sqlInjectionResult = await detectSQLInjectionForProject(projectId)
    if (sqlInjectionResult) {
      detectedPatterns.push(sqlInjectionResult)
      console.log(
        `[Pattern Detection] SQL injection detected for project ${projectId}: ` +
        `${sqlInjectionResult.occurrence_count} occurrence(s) - ` +
        `Severity: ${sqlInjectionResult.severity.toUpperCase()}`
      )
    }

    // Check for auth brute force patterns
    const bruteForceResult = await detectAuthBruteForceForProject(projectId)
    if (bruteForceResult) {
      detectedPatterns.push(bruteForceResult)
      console.log(
        `[Pattern Detection] Auth brute force detected for project ${projectId}: ` +
        `${bruteForceResult.occurrence_count} failed attempt(s) - ` +
        `Severity: ${bruteForceResult.severity.toUpperCase()}`
      )
    }

    // Check for rapid key creation patterns
    const rapidKeyCreationResult = await detectRapidKeyCreationForProject(projectId)
    if (rapidKeyCreationResult) {
      detectedPatterns.push(rapidKeyCreationResult)
      console.log(
        `[Pattern Detection] Rapid key creation detected for project ${projectId}: ` +
        `${rapidKeyCreationResult.occurrence_count} key(s) created - ` +
        `Severity: ${rapidKeyCreationResult.severity.toUpperCase()}`
      )
    }

    return detectedPatterns
  } catch (error) {
    console.error(`[Pattern Detection] Error checking project ${projectId}:`, error)
    return []
  }
}

/**
 * Check all projects for malicious patterns
 *
 * This function is designed to be called by a background job/cron.
 * It iterates through all active projects and checks for malicious patterns.
 *
 * @returns Array of all detected patterns
 */
export async function checkAllProjectsForMaliciousPatterns(): Promise<PatternDetectionResult[]> {
  const pool = getPool()

  try {
    console.log('[Pattern Detection] Starting malicious pattern check for all projects')

    // Get all active projects
    const projectsResult = await pool.query(
      `
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
      `
    )

    const projects = projectsResult.rows
    console.log(`[Pattern Detection] Checking ${projects.length} active projects`)

    const allDetectedPatterns: PatternDetectionResult[] = []

    // Check each project for malicious patterns
    for (const project of projects) {
      const projectId = project.id

      try {
        const patterns = await checkProjectForMaliciousPatterns(projectId)
        allDetectedPatterns.push(...patterns)
      } catch (error) {
        console.error(
          `[Pattern Detection] Error checking project ${projectId}:`,
          error
        )
        // Continue with next project
      }
    }

    console.log(
      `[Pattern Detection] Pattern detection complete. ${allDetectedPatterns.length} malicious pattern(s) detected.`
    )

    return allDetectedPatterns
  } catch (error) {
    console.error('[Pattern Detection] Error checking all projects for malicious patterns:', error)
    throw new Error('Failed to check projects for malicious patterns')
  }
}

/**
 * Trigger suspension for a detected pattern
 *
 * This function suspends a project when a CRITICAL or SEVERE pattern is detected
 * and the configuration specifies suspension on detection.
 *
 * @param detection - The pattern detection result
 * @returns Whether the suspension was triggered successfully
 */
async function triggerSuspensionForPattern(
  detection: PatternDetectionResult
): Promise<boolean> {
  // Only trigger suspension for CRITICAL or SEVERE patterns
  if (detection.severity !== PatternSeverity.CRITICAL &&
      detection.severity !== PatternSeverity.SEVERE) {
    return false
  }

  // Only trigger if action_taken is 'suspension'
  if (detection.action_taken !== 'suspension') {
    return false
  }

  try {
    // Map pattern type to a hard cap type for suspension reason
    const capTypeMap: Record<MaliciousPatternType, HardCapType> = {
      [MaliciousPatternType.SQL_INJECTION]: HardCapType.DB_QUERIES_PER_DAY,
      [MaliciousPatternType.AUTH_BRUTE_FORCE]: HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
      [MaliciousPatternType.RAPID_KEY_CREATION]: HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
    }

    const capType = capTypeMap[detection.pattern_type]

    const reason = {
      cap_type: capType,
      current_value: detection.occurrence_count,
      limit_exceeded: detection.occurrence_count,
      details: detection.description,
    }

    await suspendProject(
      detection.project_id,
      reason,
      `Auto-suspended for ${detection.pattern_type}: ${detection.severity} severity pattern detected`
    )

    console.log(
      `[Pattern Detection] Suspended project ${detection.project_id} ` +
      `for ${detection.pattern_type} (${detection.severity})`
    )

    return true
  } catch (error) {
    console.error(
      `[Pattern Detection] Failed to suspend project ${detection.project_id}:`,
      error
    )
    return false
  }
}

/**
 * Process detected patterns and trigger actions
 *
 * This function logs pattern detections to the database and triggers
 * suspensions when necessary based on pattern severity and configuration.
 *
 * @param detections - Array of pattern detection results
 */
async function processPatternDetections(
  detections: PatternDetectionResult[]
): Promise<void> {
  for (const detection of detections) {
    try {
      // Log the pattern detection to the database
      await logPatternDetection(
        detection.project_id,
        detection.pattern_type,
        detection.severity,
        detection.occurrence_count,
        detection.detection_window_ms,
        detection.description,
        detection.evidence,
        detection.action_taken
      )

      // Trigger suspension if needed
      if (detection.action_taken === 'suspension') {
        await triggerSuspensionForPattern(detection)
      }
    } catch (error) {
      console.error(
        `[Pattern Detection] Failed to process detection for project ${detection.project_id}:`,
        error
      )
    }
  }
}

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
): Promise<PatternDetectionResult[]> {
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

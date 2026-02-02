/**
 * SQL Injection Detector Module
 * Functions for detecting SQL injection patterns
 */

import type { PatternMatchResult, PatternDetectionResult } from '../../types'
import { MaliciousPatternType, PatternSeverity } from '../../types'
import { DEFAULT_PATTERN_DETECTION_CONFIG, determinePatternAction, SQL_INJECTION_PATTERNS } from '../config'

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

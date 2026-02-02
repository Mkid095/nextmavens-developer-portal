/**
 * Pattern Detection Configuration Module
 * Configuration for malicious pattern detection
 */

/**
 * SQL injection detection configuration
 */
export const SQL_INJECTION_DETECTION_ENABLED = true
export const SQL_INJECTION_MIN_OCCURRENCES = 3
export const SQL_INJECTION_DETECTION_WINDOW_MS = 60 * 60 * 1000 // 1 hour
export const SQL_INJECTION_SUSPEND_ON_DETECTION = true

/**
 * Auth brute force detection configuration
 */
export const AUTH_BRUTE_FORCE_DETECTION_ENABLED = true
export const AUTH_BRUTE_FORCE_MIN_FAILED_ATTEMPTS = 10
export const AUTH_BRUTE_FORCE_DETECTION_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const AUTH_BRUTE_FORCE_SUSPEND_ON_DETECTION = true

/**
 * Rapid key creation detection configuration
 */
export const RAPID_KEY_CREATION_DETECTION_ENABLED = true
export const RAPID_KEY_CREATION_MIN_KEYS = 5
export const RAPID_KEY_CREATION_DETECTION_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
export const RAPID_KEY_CREATION_SUSPEND_ON_DETECTION = true

/**
 * Common SQL injection patterns to detect
 * These are regex patterns that match common SQL injection attempts
 */
export const SQL_INJECTION_PATTERNS: ReadonlyArray<{
  pattern: RegExp
  description: string
  severity: 'warning' | 'critical' | 'severe'
}> = [
  {
    pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    description: 'SQL keyword detected in input',
    severity: 'warning',
  },
  {
    pattern: /('|(\\')|(--)|(;)|(\|\|)|(\/\*)|(\*\/))/,
    description: 'SQL meta-characters detected',
    severity: 'critical',
  },
  {
    pattern: /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    description: 'SQL tautology detected',
    severity: 'severe',
  },
  {
    pattern: /(\b(UNION|JOIN)\s+SELECT)/i,
    description: 'SQL UNION/JOIN injection detected',
    severity: 'severe',
  },
  {
    pattern: /(\bEXEC\b|\bEXECUTE\b|\bEVAL\b|\bEXECUTE\s+IMMEDIATE\b)/i,
    description: 'SQL command execution detected',
    severity: 'severe',
  },
]

/**
 * Default pattern detection configuration
 */
export const DEFAULT_PATTERN_DETECTION_CONFIG = {
  sql_injection: {
    enabled: SQL_INJECTION_DETECTION_ENABLED,
    min_occurrences: SQL_INJECTION_MIN_OCCURRENCES,
    detection_window_ms: SQL_INJECTION_DETECTION_WINDOW_MS,
    suspend_on_detection: SQL_INJECTION_SUSPEND_ON_DETECTION,
  },
  auth_brute_force: {
    enabled: AUTH_BRUTE_FORCE_DETECTION_ENABLED,
    min_failed_attempts: AUTH_BRUTE_FORCE_MIN_FAILED_ATTEMPTS,
    detection_window_ms: AUTH_BRUTE_FORCE_DETECTION_WINDOW_MS,
    suspend_on_detection: AUTH_BRUTE_FORCE_SUSPEND_ON_DETECTION,
  },
  rapid_key_creation: {
    enabled: RAPID_KEY_CREATION_DETECTION_ENABLED,
    min_keys_created: RAPID_KEY_CREATION_MIN_KEYS,
    detection_window_ms: RAPID_KEY_CREATION_DETECTION_WINDOW_MS,
    suspend_on_detection: RAPID_KEY_CREATION_SUSPEND_ON_DETECTION,
  },
} as const

/**
 * Pattern severity thresholds
 * Determines what action to take based on pattern severity and count
 */
export interface PatternActionThreshold {
  /** Minimum severity to trigger this action */
  minSeverity: 'warning' | 'critical' | 'severe'
  /** Minimum occurrence count to trigger this action */
  minOccurrences: number
  /** Action to take */
  action: 'warning' | 'suspension' | 'none'
}

/**
 * Default pattern action thresholds
 */
export const DEFAULT_PATTERN_ACTION_THRESHOLDS: PatternActionThreshold[] = [
  { minSeverity: 'severe', minOccurrences: 1, action: 'suspension' },
  { minSeverity: 'critical', minOccurrences: 3, action: 'suspension' },
  { minSeverity: 'critical', minOccurrences: 1, action: 'warning' },
  { minSeverity: 'warning', minOccurrences: 5, action: 'warning' },
]

/**
 * Determine pattern action based on severity and occurrences
 *
 * @param severity - The pattern severity
 * @param occurrences - Number of occurrences
 * @returns The action to take
 */
export function determinePatternAction(
  severity: 'warning' | 'critical' | 'severe',
  occurrences: number
): 'warning' | 'suspension' | 'none' {
  // Sort thresholds by severity (severe first) and minOccurrences descending
  const severityOrder = { severe: 3, critical: 2, warning: 1 }
  const sortedThresholds = [...DEFAULT_PATTERN_ACTION_THRESHOLDS].sort(
    (a, b) => severityOrder[b.minSeverity] - severityOrder[a.minSeverity] ||
              b.minOccurrences - a.minOccurrences
  )

  for (const threshold of sortedThresholds) {
    if (severityOrder[severity] >= severityOrder[threshold.minSeverity] &&
        occurrences >= threshold.minOccurrences) {
      return threshold.action
    }
  }

  return 'none'
}

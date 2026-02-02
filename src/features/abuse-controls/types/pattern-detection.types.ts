/**
 * Pattern Detection Types
 * Types for malicious pattern detection
 */

/**
 * Malicious pattern types that can be detected
 */
export enum MaliciousPatternType {
  /** SQL injection attempts in queries */
  SQL_INJECTION = 'sql_injection',
  /** Authentication brute force attacks */
  AUTH_BRUTE_FORCE = 'auth_brute_force',
  /** Rapid sequential API key creation */
  RAPID_KEY_CREATION = 'rapid_key_creation',
}

/**
 * Malicious pattern severity levels
 */
export enum PatternSeverity {
  /** Warning level - pattern detected but may be legitimate */
  WARNING = 'warning',
  /** Critical level - highly suspicious activity */
  CRITICAL = 'critical',
  /** Severe level - clear malicious intent */
  SEVERE = 'severe',
}

/**
 * SQL injection pattern configuration
 */
export interface SQLInjectionPatternConfig {
  /** Whether SQL injection detection is enabled */
  enabled: boolean
  /** Minimum number of suspicious queries to trigger detection */
  min_occurrences: number
  /** Time window for detection in milliseconds */
  detection_window_ms: number
  /** Whether to trigger suspension on detection */
  suspend_on_detection: boolean
}

/**
 * Auth brute force pattern configuration
 */
export interface AuthBruteForcePatternConfig {
  /** Whether brute force detection is enabled */
  enabled: boolean
  /** Minimum number of failed auth attempts to trigger detection */
  min_failed_attempts: number
  /** Time window for detection in milliseconds */
  detection_window_ms: number
  /** Whether to trigger suspension on detection */
  suspend_on_detection: boolean
}

/**
 * Rapid key creation pattern configuration
 */
export interface RapidKeyCreationPatternConfig {
  /** Whether rapid key creation detection is enabled */
  enabled: boolean
  /** Minimum number of keys created to trigger detection */
  min_keys_created: number
  /** Time window for detection in milliseconds */
  detection_window_ms: number
  /** Whether to trigger suspension on detection */
  suspend_on_detection: boolean
}

/**
 * Malicious pattern detection configuration
 */
export interface PatternDetectionConfig {
  /** SQL injection pattern configuration */
  sql_injection: SQLInjectionPatternConfig
  /** Auth brute force pattern configuration */
  auth_brute_force: AuthBruteForcePatternConfig
  /** Rapid key creation pattern configuration */
  rapid_key_creation: RapidKeyCreationPatternConfig
}

/**
 * Malicious pattern detection result
 */
export interface PatternDetectionResult {
  /** Project ID where pattern was detected */
  project_id: string
  /** Type of malicious pattern detected */
  pattern_type: MaliciousPatternType
  /** Severity level of the detected pattern */
  severity: PatternSeverity
  /** Number of pattern occurrences detected */
  occurrence_count: number
  /** Time window in which pattern was detected */
  detection_window_ms: number
  /** When the pattern was detected */
  detected_at: Date
  /** Description of what was detected */
  description: string
  /** Evidence/context of the pattern detection */
  evidence?: string[]
  /** Whether action was taken (warning/suspension) */
  action_taken: 'warning' | 'suspension' | 'none'
}

/**
 * Pattern detection background job result
 */
export interface PatternDetectionJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  started_at: Date
  /** Timestamp when the job completed */
  completed_at: Date
  /** Duration in milliseconds */
  duration_ms: number
  /** Number of projects checked */
  projects_checked: number
  /** Number of patterns detected */
  patterns_detected: number
  /** Details of detected patterns */
  detected_patterns: PatternDetectionResult[]
  /** Breakdown by pattern type */
  patterns_by_type: {
    sql_injection: number
    auth_brute_force: number
    rapid_key_creation: number
  }
  /** Breakdown by action type */
  actions_taken: {
    warnings: number
    suspensions: number
  }
  /** Error message if job failed */
  error?: string
}

/**
 * Pattern match result for individual checks
 */
export interface PatternMatchResult {
  /** Whether the pattern was matched */
  matched: boolean
  /** Confidence score (0-1) of the match */
  confidence: number
  /** Details about what was matched */
  details?: string
  /** Evidence of the pattern match */
  evidence?: string[]
}

/**
 * Abuse Dashboard Queries Module - Types
 */

/**
 * Query result row types for internal use
 */
export interface SuspensionsResultRow {
  cap_exceeded: string
  count: string
}

export interface RateLimitsResultRow {
  identifier_type: string
  count: string
}

export interface CapViolationRow {
  project_id: string
  project_name: string
  organization: string
  cap_exceeded: string
  reason: string
  suspended_at: Date
}

export interface ApproachingCapsRow {
  project_id: string
  project_name: string
  organization: string
  cap_type: string
  cap_value: string
  current_usage: string
  usage_percentage: string
}

export interface PatternTypeRow {
  pattern_type: string
  count: string
}

export interface PatternSeverityRow {
  severity: string
  count: string
}

export interface PatternDetectionRow {
  project_id: string
  project_name: string
  organization: string
  pattern_type: string
  severity: string
  occurrence_count: string
  description: string
  detected_at: Date
}

/**
 * Query time range parameters
 */
export interface TimeRange {
  startTime: Date
  endTime: Date
}

/**
 * Query result with error handling
 */
export interface QueryResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Abuse Dashboard Queries Module - Constants
 */

import type { TimeRange } from './types'

/**
 * Default limits for query results
 */
export const DEFAULT_LIMITS = {
  CAP_VIOLATIONS: 50,
  APPROACHING_CAPS: 20,
  RECENT_PATTERNS: 20,
} as const

/**
 * Error messages for query failures
 */
export const ERROR_MESSAGES = {
  SUSPENSIONS_STATS: '[Dashboard] Error fetching suspension stats',
  RATE_LIMITS_STATS: '[Dashboard] Error fetching rate limit stats',
  CAP_VIOLATIONS: '[Dashboard] Error fetching cap violations',
  APPROACHING_CAPS: '[Dashboard] Error fetching approaching caps',
  PATTERNS_STATS: '[Dashboard] Error fetching pattern stats',
} as const

/**
 * Empty/default return values for failed queries
 */
export const EMPTY_RESULTS = {
  SUSPENSIONS_STATS: {
    total: 0,
    active: 0,
    by_type: {},
  },
  RATE_LIMITS_STATS: {
    total: 0,
    by_type: {},
  },
  CAP_VIOLATIONS: {
    total: 0,
    violations: [],
  },
  APPROACHING_CAPS: {
    total: 0,
    projects: [],
  },
  PATTERNS_STATS: {
    total: 0,
    by_type: {},
    by_severity: {},
    recent: [],
  },
} as const

/**
 * SQL Queries
 */
export const SQL_QUERIES = {
  // Suspensions queries
  SUSPENSIONS_TOTAL: (range: TimeRange) => `
    SELECT COUNT(*) as count
    FROM suspensions
    WHERE suspended_at >= $1 AND suspended_at <= $2
  `,

  SUSPENSIONS_ACTIVE: `
    SELECT COUNT(*) as count
    FROM suspensions
    WHERE resolved_at IS NULL
  `,

  SUSPENSIONS_BY_TYPE: (range: TimeRange) => `
    SELECT
      cap_exceeded,
      COUNT(*) as count
    FROM suspensions
    WHERE suspended_at >= $1 AND suspended_at <= $2
    GROUP BY cap_exceeded
  `,

  // Rate limits queries
  RATE_LIMITS_TOTAL: (range: TimeRange) => `
    SELECT COUNT(*) as count
    FROM rate_limits
    WHERE created_at >= $1 AND created_at <= $2
  `,

  RATE_LIMITS_BY_TYPE: (range: TimeRange) => `
    SELECT
      identifier_type,
      COUNT(*) as count
    FROM rate_limits
    WHERE created_at >= $1 AND created_at <= $2
    GROUP BY identifier_type
  `,

  // Cap violations queries
  CAP_VIOLATIONS: (range: TimeRange, limit: number) => `
    SELECT
      s.project_id,
      p.name as project_name,
      p.organization,
      s.cap_exceeded,
      s.reason,
      s.suspended_at
    FROM suspensions s
    JOIN projects p ON s.project_id = p.id
    WHERE s.suspended_at >= $1 AND s.suspended_at <= $2
    ORDER BY s.suspended_at DESC
    LIMIT ${limit}
  `,

  // Approaching caps queries
  APPROACHING_CAPS: (limit: number) => `
    SELECT
      q.project_id,
      p.name as project_name,
      p.organization,
      q.cap_type,
      q.cap_value,
      0 as current_usage,
      0 as usage_percentage
    FROM quotas q
    JOIN projects p ON q.project_id = p.id
    WHERE p.status = 'active'
    ORDER BY q.cap_value DESC
    LIMIT ${limit}
  `,

  // Pattern detections queries
  PATTERNS_TOTAL: (range: TimeRange) => `
    SELECT COUNT(*) as count
    FROM pattern_detections
    WHERE detected_at >= $1 AND detected_at <= $2
  `,

  PATTERNS_BY_TYPE: (range: TimeRange) => `
    SELECT
      pattern_type,
      COUNT(*) as count
    FROM pattern_detections
    WHERE detected_at >= $1 AND detected_at <= $2
    GROUP BY pattern_type
  `,

  PATTERNS_BY_SEVERITY: (range: TimeRange) => `
    SELECT
      severity,
      COUNT(*) as count
    FROM pattern_detections
    WHERE detected_at >= $1 AND detected_at <= $2
    GROUP BY severity
  `,

  PATTERNS_RECENT: (range: TimeRange, limit: number) => `
    SELECT
      pd.project_id,
      p.name as project_name,
      p.organization,
      pd.pattern_type,
      pd.severity,
      pd.occurrence_count,
      pd.description,
      pd.detected_at
    FROM pattern_detections pd
    JOIN projects p ON pd.project_id = p.id
    WHERE pd.detected_at >= $1 AND pd.detected_at <= $2
    ORDER BY pd.detected_at DESC
    LIMIT ${limit}
  `,
} as const

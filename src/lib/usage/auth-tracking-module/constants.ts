/**
 * Auth Usage Tracking Module - Constants
 */

import type { AuthMetricType } from './types'

/**
 * Valid auth metric types
 */
export const VALID_METRIC_TYPES: AuthMetricType[] = ['auth_signup', 'auth_signin']

/**
 * Default time range for stats queries (30 days)
 */
export const DEFAULT_TIME_RANGE_DAYS = 30

/**
 * Service name for usage metrics
 */
export const SERVICE_NAME = 'auth'

/**
 * Log prefixes
 */
export const LOG_PREFIXES = {
  MAIN: '[AuthUsageTracking]',
  MISSING_PROJECT_ID: '[AuthUsageTracking] Missing projectId',
  INVALID_METRIC_TYPE: '[AuthUsageTracking] Invalid metricType:',
  INVALID_QUANTITY: '[AuthUsageTracking] Invalid quantity:',
  FAILED_TO_RECORD: '[AuthUsageTracking] Failed to record metric:',
  RECORDED_METRIC: '[AuthUsageTracking] Recorded:',
  RECORDED_METRICS: '[AuthUsageTracking] Recorded',
  METRICS_COUNT: 'metrics',
  ERROR_GETTING_STATS: '[AuthUsageTracking] Error getting auth usage stats:',
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  MISSING_PROJECT_ID: 'Missing projectId',
  INVALID_METRIC_TYPE: 'Invalid metricType',
  INVALID_QUANTITY: 'Invalid quantity',
} as const

/**
 * SQL queries
 */
export const SQL_QUERIES = {
  INSERT_METRIC: `
    INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
    VALUES ($1, $2, $3, $4, NOW())
  `,

  GET_AGGREGATED_STATS: `
    SELECT
      SUM(CASE WHEN metric_type = 'auth_signup' THEN quantity ELSE 0 END) as auth_signup_count,
      SUM(CASE WHEN metric_type = 'auth_signin' THEN quantity ELSE 0 END) as auth_signin_count
    FROM control_plane.usage_metrics
    WHERE project_id = $1
      AND service = $2
      AND recorded_at >= $3
      AND recorded_at <= $4
  `,

  GET_BREAKDOWN_BY_DAY: `
    SELECT
      DATE(recorded_at) as date,
      SUM(CASE WHEN metric_type = 'auth_signup' THEN quantity ELSE 0 END) as auth_signup_count,
      SUM(CASE WHEN metric_type = 'auth_signin' THEN quantity ELSE 0 END) as auth_signin_count
    FROM control_plane.usage_metrics
    WHERE project_id = $1
      AND service = $2
      AND recorded_at >= $3
      AND recorded_at <= $4
    GROUP BY DATE(recorded_at)
    ORDER BY date DESC
  `,
} as const

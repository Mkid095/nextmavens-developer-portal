/**
 * Auth Usage Tracking Module - Validators
 */

import type { AuthUsageMetric } from './types'
import { VALID_METRIC_TYPES, ERROR_MESSAGES, LOG_PREFIXES } from './constants'

/**
 * Validate a single auth usage metric
 */
export function validateAuthMetric(metric: AuthUsageMetric): boolean {
  if (!metric.projectId) {
    console.error(LOG_PREFIXES.MISSING_PROJECT_ID)
    return false
  }

  if (!VALID_METRIC_TYPES.includes(metric.metricType)) {
    console.error(LOG_PREFIXES.INVALID_METRIC_TYPE, metric.metricType)
    return false
  }

  if (typeof metric.quantity !== 'number' || metric.quantity < 0) {
    console.error(LOG_PREFIXES.INVALID_QUANTITY, metric.quantity)
    return false
  }

  return true
}

/**
 * Validate multiple auth usage metrics
 */
export function validateAuthMetrics(metrics: AuthUsageMetric[]): boolean {
  if (!metrics || metrics.length === 0) {
    return false
  }

  return metrics.every(validateAuthMetric)
}

/**
 * Validate project ID
 */
export function validateProjectId(projectId: string): boolean {
  if (!projectId) {
    console.error(LOG_PREFIXES.MISSING_PROJECT_ID)
    return false
  }
  return true
}

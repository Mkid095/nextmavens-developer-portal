/**
 * Storage Usage Tracking - Module - Validators
 */

import type { StorageUsageMetric } from '../types'
import { VALID_METRIC_TYPES } from './constants'

export function validateStorageMetric(metric: StorageUsageMetric): { valid: boolean; error?: string } {
  const { projectId, metricType, quantity } = metric

  if (!projectId) {
    return { valid: false, error: 'Missing projectId' }
  }

  if (!VALID_METRIC_TYPES.includes(metricType)) {
    return { valid: false, error: `Invalid metricType: ${metricType}` }
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    return { valid: false, error: `Invalid quantity: ${quantity}` }
  }

  return { valid: true }
}

export function validateStorageMetrics(metrics: StorageUsageMetric[]): { valid: boolean; error?: string } {
  if (!metrics || metrics.length === 0) {
    return { valid: false, error: 'No metrics provided' }
  }

  for (const metric of metrics) {
    const validation = validateStorageMetric(metric)
    if (!validation.valid) {
      return validation
    }
  }

  return { valid: true }
}

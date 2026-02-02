/**
 * Warning Calculator
 *
 * Calculates warning levels based on quota usage.
 * US-005: Implement Quota Warnings
 */

import {
  WARNING_THRESHOLD_80,
  WARNING_THRESHOLD_90,
} from './constants'
import {
  QuotaWarningLevel,
  WarningLevelCalculation,
} from './types'

/**
 * Calculate warning level based on usage percentage
 *
 * @param usagePercentage - Current usage percentage
 * @returns Warning level if threshold met, null otherwise
 */
export function calculateWarningLevel(
  usagePercentage: number
): QuotaWarningLevel | null {
  if (usagePercentage >= WARNING_THRESHOLD_90) {
    return QuotaWarningLevel.WARNING_90
  }
  if (usagePercentage >= WARNING_THRESHOLD_80) {
    return QuotaWarningLevel.WARNING_80
  }
  return null
}

/**
 * Calculate usage percentage from current usage and limit
 *
 * @param currentUsage - Current usage value
 * @param monthlyLimit - Monthly limit
 * @returns Usage percentage (rounded to 1 decimal place)
 */
export function calculateUsagePercentage(
  currentUsage: number,
  monthlyLimit: number
): number {
  if (monthlyLimit <= 0) {
    return 0
  }
  return Math.round((currentUsage / monthlyLimit) * 1000) / 10
}

/**
 * Calculate full warning level result from usage data
 *
 * @param currentUsage - Current usage value
 * @param monthlyLimit - Monthly limit
 * @param resetAt - When quota resets
 * @returns Warning level calculation result
 */
export function calculateWarningLevelResult(
  currentUsage: number,
  monthlyLimit: number,
  resetAt: Date
): WarningLevelCalculation {
  const usagePercentage = calculateUsagePercentage(currentUsage, monthlyLimit)
  const warningLevel = calculateWarningLevel(usagePercentage)

  return {
    warningLevel,
    usagePercentage,
    currentUsage,
    monthlyLimit,
    resetAt,
  }
}

/**
 * Check if usage is at or above 80% threshold
 *
 * @param usagePercentage - Current usage percentage
 * @returns True if at or above 80%
 */
export function isAboveWarningThreshold(usagePercentage: number): boolean {
  return usagePercentage >= WARNING_THRESHOLD_80
}

/**
 * Check if usage is at or above 90% threshold (critical)
 *
 * @param usagePercentage - Current usage percentage
 * @returns True if at or above 90%
 */
export function isAboveCriticalThreshold(usagePercentage: number): boolean {
  return usagePercentage >= WARNING_THRESHOLD_90
}

/**
 * Determine if a warning should be displayed based on usage
 *
 * @param currentUsage - Current usage value
 * @param monthlyLimit - Monthly limit
 * @returns True if warning should be shown
 */
export function shouldShowWarning(
  currentUsage: number,
  monthlyLimit: number
): boolean {
  const usagePercentage = calculateUsagePercentage(currentUsage, monthlyLimit)
  return isAboveWarningThreshold(usagePercentage)
}

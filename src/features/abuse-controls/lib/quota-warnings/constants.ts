/**
 * Quota Warnings Constants
 *
 * Constants for the quota warnings system.
 * US-005: Implement Quota Warnings
 */

import { QuotaWarningLevel } from './types'

/**
 * Quota warning thresholds
 */
export const WARNING_THRESHOLD_80 = 80
export const WARNING_THRESHOLD_90 = 90

/**
 * List of services to monitor for quota warnings
 */
export const MONITORED_SERVICES = [
  'db_queries',
  'storage_mb',
  'realtime_connections',
  'function_invocations',
  'auth_users',
] as const

/**
 * Number of services checked per project
 */
export const SERVICES_COUNT_PER_PROJECT = MONITORED_SERVICES.length

/**
 * Map warning level to threshold percentage
 */
export const WARNING_LEVEL_THRESHOLDS: Record<QuotaWarningLevel, number> = {
  [QuotaWarningLevel.WARNING_80]: WARNING_THRESHOLD_80,
  [QuotaWarningLevel.WARNING_90]: WARNING_THRESHOLD_90,
} as const

/**
 * Get urgency label for warning level
 */
export function getWarningUrgency(warningLevel: QuotaWarningLevel): string {
  return warningLevel === QuotaWarningLevel.WARNING_90 ? 'URGENT' : 'IMPORTANT'
}

/**
 * Get threshold percentage for warning level
 */
export function getWarningThreshold(warningLevel: QuotaWarningLevel): number {
  return WARNING_LEVEL_THRESHOLDS[warningLevel]
}

/**
 * Hard Cap Configuration Module
 * Configuration for hard caps and quota management
 */

import { HardCapType, HardCapConfig, DEFAULT_HARD_CAPS } from '../../types'

/**
 * Default hard caps for new projects
 */
export const DEFAULT_QUOTA_CONFIGS: HardCapConfig[] = [
  {
    type: HardCapType.DB_QUERIES_PER_DAY,
    value: DEFAULT_HARD_CAPS[HardCapType.DB_QUERIES_PER_DAY],
  },
  {
    type: HardCapType.REALTIME_CONNECTIONS,
    value: DEFAULT_HARD_CAPS[HardCapType.REALTIME_CONNECTIONS],
  },
  {
    type: HardCapType.STORAGE_UPLOADS_PER_DAY,
    value: DEFAULT_HARD_CAPS[HardCapType.STORAGE_UPLOADS_PER_DAY],
  },
  {
    type: HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
    value: DEFAULT_HARD_CAPS[HardCapType.FUNCTION_INVOCATIONS_PER_DAY],
  },
]

/**
 * Hard cap display names for UI
 */
export const HARD_CAP_DISPLAY_NAMES: Record<HardCapType, string> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 'Database Queries per Day',
  [HardCapType.REALTIME_CONNECTIONS]: 'Realtime Connections',
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 'Storage Uploads per Day',
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 'Function Invocations per Day',
}

/**
 * Hard cap descriptions for UI
 */
export const HARD_CAP_DESCRIPTIONS: Record<HardCapType, string> = {
  [HardCapType.DB_QUERIES_PER_DAY]:
    'Maximum number of database queries allowed per day. Exceeding this limit will trigger auto-suspension.',
  [HardCapType.REALTIME_CONNECTIONS]:
    'Maximum number of simultaneous realtime connections. Exceeding this limit will reject new connections.',
  [HardCapType.STORAGE_UPLOADS_PER_DAY]:
    'Maximum number of file uploads allowed per day. Exceeding this limit will trigger auto-suspension.',
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]:
    'Maximum number of serverless function invocations allowed per day. Exceeding this limit will trigger auto-suspension.',
}

/**
 * Minimum allowed values for each cap type
 */
export const MIN_HARD_CAPS: Record<HardCapType, number> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 100,
  [HardCapType.REALTIME_CONNECTIONS]: 1,
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 10,
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 50,
}

/**
 * Maximum allowed values for each cap type
 */
export const MAX_HARD_CAPS: Record<HardCapType, number> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 1_000_000,
  [HardCapType.REALTIME_CONNECTIONS]: 10_000,
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 100_000,
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 500_000,
}

/**
 * Validate if a cap value is within allowed range
 */
export function validateCapValue(capType: HardCapType, value: number): boolean {
  const min = MIN_HARD_CAPS[capType]
  const max = MAX_HARD_CAPS[capType]
  return value >= min && value <= max
}

/**
 * Get validation error message for a cap value
 */
export function getCapValidationError(capType: HardCapType, value: number): string | null {
  const min = MIN_HARD_CAPS[capType]
  const max = MAX_HARD_CAPS[capType]
  const displayName = HARD_CAP_DISPLAY_NAMES[capType]

  if (value < min) {
    return `${displayName} must be at least ${min.toLocaleString()}`
  }

  if (value > max) {
    return `${displayName} cannot exceed ${max.toLocaleString()}`
  }

  return null
}

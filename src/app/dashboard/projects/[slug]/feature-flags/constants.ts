/**
 * Feature Flags Page Constants
 * Available flag names and other constants
 */

export const AVAILABLE_FLAGS = [
  'signups_enabled',
  'provisioning_enabled',
  'storage_enabled',
  'realtime_enabled',
] as const

export type AvailableFlag = (typeof AVAILABLE_FLAGS)[number]

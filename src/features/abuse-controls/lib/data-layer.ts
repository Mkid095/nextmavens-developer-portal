/**
 * Data Layer Integration for Abuse Controls
 *
 * This module provides centralized access to quota management, enforcement,
 * spike detection, and suspension management for integration with other parts
 * of the application.
 *
 * @deprecated This file has been refactored into a modular structure.
 *            Please import from './data-layer' instead.
 *            This file is kept for backward compatibility.
 *
 * @example
 * // Old way (deprecated):
 * import { QuotaManager } from './data-layer'
 *
 * // New way (recommended):
 * import { QuotaManager } from './data-layer/index'
 */

// Re-export everything from the new modular structure
export {
  QuotaManager,
  SuspensionManager,
  SpikeDetectionManager,
  ErrorRateDetectionManager,
  PatternDetectionManager,
  NotificationManager,
  NotificationPreferencesManager,
  OverrideManager,
  withQuotaCheck,
  withSuspensionCheck,
  createQuotaChecker,
  QuotaExceededError,
  ProjectSuspendedError,
  DEFAULT_LIMITS,
  ERROR_CODES,
} from './data-layer/index'

// Re-export commonly used types for convenience
export type {
  SuspensionRecord,
  SuspensionReason,
  SpikeDetectionResult,
  SpikeDetectionJobResult,
  ErrorRateDetectionResult,
  ErrorRateDetectionJobResult,
  PatternDetectionResult,
  PatternDetectionJobResult,
  Notification,
  NotificationRecipient,
  NotificationDeliveryResult,
  ManualOverrideRequest,
  ManualOverrideResult,
  OverrideRecord,
} from '../types'

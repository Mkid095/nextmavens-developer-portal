/**
 * Data Layer Integration for Abuse Controls
 *
 * This module provides centralized access to quota management, enforcement,
 * spike detection, and suspension management for integration with other parts
 * of the application.
 */

// Export all manager classes
export { QuotaManager, withQuotaCheck, createQuotaChecker } from './quota-manager'
export { SuspensionManager, withSuspensionCheck } from './suspension-manager'
export { SpikeDetectionManager } from './spike-detection-manager'
export { ErrorRateDetectionManager } from './error-rate-manager'
export { PatternDetectionManager } from './pattern-detection-manager'
export { NotificationManager, NotificationPreferencesManager } from './notification-manager'
export { OverrideManager } from './override-manager'

// Export custom error types
export { QuotaExceededError, ProjectSuspendedError } from './types'

// Export constants
export { DEFAULT_LIMITS, ERROR_CODES } from './constants'

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

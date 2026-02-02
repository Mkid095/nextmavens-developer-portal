/**
 * Abuse Control Types
 * Re-exports all types for the abuse-controls feature
 */

// Quota and Hard Cap Types
export {
  HardCapType,
  DEFAULT_HARD_CAPS,
  type ProjectQuota,
  type HardCapConfig,
  type ProjectUsage,
  type QuotaViolation,
  RateLimitIdentifierType,
  type RateLimitIdentifier,
  type RateLimitResult,
  type RateLimitError,
} from './quota.types'

// Suspension Types
export {
  ProjectStatus,
  type SuspensionReason,
  SuspensionType,
  type SuspensionRecord,
  type SuspensionHistoryEntry,
} from './suspension.types'

// Spike Detection Types
export {
  SpikeSeverity,
  SpikeAction,
  type SpikeDetectionConfig,
  type UsageSpikeDetection,
  type UsageStatistics,
  type SpikeDetectionResult,
  type UsageMetric,
  type SpikeDetectionJobResult,
} from './spike-detection.types'

// Error Rate Detection Types
export {
  ErrorRateSeverity,
  ErrorRateAction,
  type ErrorRateDetectionConfig,
  type ErrorRateDetectionResult,
  type ErrorRateDetectionJobResult,
  type ErrorMetric,
} from './error-rate.types'

// Pattern Detection Types
export {
  MaliciousPatternType,
  PatternSeverity,
  type SQLInjectionPatternConfig,
  type AuthBruteForcePatternConfig,
  type RapidKeyCreationPatternConfig,
  type PatternDetectionConfig,
  type PatternDetectionResult,
  type PatternDetectionJobResult,
  type PatternMatchResult,
} from './pattern-detection.types'

// Notification Types
export {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  type NotificationRecipient,
  type Notification,
  type SuspensionNotificationTemplate,
  type NotificationDeliveryResult,
  SuspensionNotificationType,
  SuspensionNotificationStatus,
  type SuspensionNotification,
  type SuspensionNotificationParams,
} from './notification.types'

// Manual Override Types
export {
  ManualOverrideAction,
  type ManualOverrideRequest,
  type PreviousStateSnapshot,
  type ManualOverrideResult,
  type OverrideRecord,
} from './manual-override.types'

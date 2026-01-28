/**
 * Abuse Controls Feature
 * Provides hard cap management and quota enforcement for projects
 */

// Types
export type {
  ProjectQuota,
  HardCapConfig,
  ProjectUsage,
  QuotaViolation,
  RateLimitIdentifier,
  RateLimitResult,
  RateLimitError,
  SuspensionReason,
  SuspensionRecord,
  SuspensionHistoryEntry,
  UsageSpikeDetection,
  UsageStatistics,
  SpikeDetectionConfig,
  SpikeDetectionResult,
  UsageMetric,
  ErrorRateDetectionResult,
  ErrorRateDetectionConfig,
  ErrorMetric,
  PatternDetectionResult,
  PatternDetectionConfig,
  PatternMatchResult,
  PatternDetectionJobResult,
  SQLInjectionPatternConfig,
  AuthBruteForcePatternConfig,
  RapidKeyCreationPatternConfig,
  Notification,
  NotificationRecipient,
  SuspensionNotificationTemplate,
  NotificationDeliveryResult,
  ManualOverrideRequest,
  ManualOverrideResult,
  OverrideRecord,
  PreviousStateSnapshot,
} from './types'

export {
  HardCapType,
  DEFAULT_HARD_CAPS,
  RateLimitIdentifierType,
  ProjectStatus,
  SpikeAction,
  SpikeSeverity,
  ErrorRateSeverity,
  ErrorRateAction,
  MaliciousPatternType,
  PatternSeverity,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  ManualOverrideAction,
} from './types'

// Quota management
export {
  getProjectQuotas,
  getProjectQuota,
  setProjectQuota,
  setProjectQuotas,
  applyDefaultQuotas,
  hasQuotasConfigured,
  deleteProjectQuota,
  resetProjectQuotas,
  getProjectsExceedingQuota,
  getProjectQuotaStats,
} from './lib/quotas'

// Configuration
export {
  DEFAULT_QUOTA_CONFIGS,
  HARD_CAP_DISPLAY_NAMES,
  HARD_CAP_DESCRIPTIONS,
  MIN_HARD_CAPS,
  MAX_HARD_CAPS,
  validateCapValue,
  getCapValidationError,
  SPIKE_THRESHOLD,
  SPIKE_DETECTION_WINDOW_MS,
  SPIKE_BASELINE_PERIOD_MS,
  MIN_USAGE_FOR_SPIKE_DETECTION,
  DEFAULT_SPIKE_ACTION_THRESHOLDS,
  DEFAULT_SPIKE_SEVERITY_THRESHOLDS,
  determineSpikeSeverity,
  type SpikeActionThreshold,
  type SpikeSeverityThreshold,
} from './lib/config'

// Migrations
export {
  createQuotasTable,
  applyDefaultQuotas as migrationApplyDefaultQuotas,
} from './migrations/create-quotas-table'

export {
  createSuspensionsTable,
  addProjectStatusColumn,
} from './migrations/create-suspensions-table'

export {
  createPatternDetectionsTable,
  logPatternDetection,
  getPatternDetections,
  getRecentPatternDetections,
  getPatternDetectionStatistics,
  cleanupOldPatternDetections,
} from './migrations/create-pattern-detections-table'

export {
  createPatternDetectionConfigTable,
  getPatternDetectionConfig as getPatternDetectionConfigFromDb,
  upsertPatternDetectionConfig,
  deletePatternDetectionConfig,
  getAllPatternDetectionConfigs,
} from './migrations/create-pattern-detection-config-table'

export {
  createNotificationsTable,
  getNotificationStatistics,
  getPendingNotifications,
} from './migrations/create-notifications-table'

export {
  createNotificationPreferencesTable,
  getNotificationPreferences as getNotificationPreferencesFromDb,
  upsertNotificationPreference as upsertNotificationPreferenceToDb,
  deleteNotificationPreference as deleteNotificationPreferenceFromDb,
  getDefaultNotificationPreferences,
  applyDefaultNotificationPreferences,
} from './migrations/create-notification-preferences-table'

// Data Layer
export {
  QuotaManager,
  withQuotaCheck,
  QuotaExceededError,
  createQuotaChecker,
  SuspensionManager,
  withSuspensionCheck,
  ProjectSuspendedError,
  SpikeDetectionManager,
  ErrorRateDetectionManager,
  PatternDetectionManager,
  NotificationManager,
  NotificationPreferencesManager,
  OverrideManager,
} from './lib/data-layer'

// Enforcement
export {
  checkQuota,
  checkMultipleQuotas,
  canPerformOperation,
  recordUsage,
  getQuotaViolations,
  getCurrentUsage,
  type QuotaCheckResult,
} from './lib/enforcement'

// Rate Limiting
export {
  checkRateLimit,
  recordRateLimitAttempt,
  getRetryAfterSeconds,
  createRateLimitError,
  extractClientIP,
} from './lib/rate-limiter'

// Suspensions
export {
  suspendProject,
  unsuspendProject,
  getSuspensionStatus,
  isCapExceeded,
  checkAllProjectsForSuspension,
  getAllActiveSuspensions,
  getSuspensionHistory,
} from './lib/suspensions'

// Background Job
export {
  runSuspensionCheck,
  getSuspensionSummary,
  type BackgroundJobResult,
} from './lib/background-job'

// Spike Detection
export {
  runSpikeDetection,
  checkAllProjectsForSpikes,
  checkProjectSpikeStatus,
  getSpikeDetectionHistory,
  getSpikeDetectionConfig,
  type SpikeDetectionJobResult,
} from './lib/spike-detection'

// Error Rate Detection
export {
  calculateErrorRate,
  detectHighErrorRate,
  checkProjectForHighErrorRate,
  checkAllProjectsForHighErrorRates,
  runErrorRateDetection,
  getErrorRateDetectionConfig,
  getErrorRateDetectionHistory,
  checkProjectErrorRateStatus,
  recordErrorMetrics,
  getErrorRateDetectionSummary,
  type ErrorRateDetectionJobResult,
} from './lib/error-rate-detection'

// Pattern Detection
export {
  checkProjectForMaliciousPatterns,
  checkAllProjectsForMaliciousPatterns,
  runPatternDetection,
  getPatternDetectionConfig,
  getPatternDetectionSummary,
  checkProjectPatternStatus,
  detectSQLInjection,
} from './lib/pattern-detection'

// Notifications
export {
  getNotificationRecipients,
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
  createNotification,
  sendEmailNotification,
  sendSuspensionNotification,
  updateNotificationDeliveryStatus,
  getNotification,
  getProjectNotifications,
  retryFailedNotifications,
} from './lib/notifications'

// Notification Preferences
export {
  getNotificationPreferences,
  getNotificationPreference,
  upsertNotificationPreference,
  deleteNotificationPreference,
  getDefaultNotificationPreferences as getDefaultNotificationPrefs,
  applyDefaultNotificationPreferences as applyDefaultNotificationPrefs,
  shouldReceiveNotification,
  getEnabledChannels,
  type NotificationPreference,
  type NotificationPreferenceInput,
} from './lib/notification-preferences'

// Manual Overrides
export {
  performManualOverride,
  getOverrideHistory,
  getProjectOverrides,
  getAllOverrides,
  getOverrideStatistics,
  getOverrideById,
  validateManualOverrideRequest,
} from './lib/manual-overrides'

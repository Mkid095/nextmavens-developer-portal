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

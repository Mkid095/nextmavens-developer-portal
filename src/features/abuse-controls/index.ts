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
} from './types'

export {
  HardCapType,
  DEFAULT_HARD_CAPS,
  RateLimitIdentifierType,
  ProjectStatus,
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

/**
 * Quota Warnings Library
 *
 * Manages quota warning notifications when projects approach their limits.
 * Sends warnings at 80% and 90% of quota usage via email and dashboard alerts.
 *
 * US-005: Implement Quota Warnings
 * - Warning sent at 80% of quota
 * - Warning sent at 90% of quota
 * - Notification sent via email
 * - Warning shown in dashboard
 * - Clear and actionable warning messages
 *
 * @deprecated This file has been refactored into a modular structure.
 *            Please import from './quota-warnings' instead.
 *            This file is kept for backward compatibility.
 */

// Re-export everything from the new modular structure
export {
  // Types
  QuotaWarningLevel,
  type QuotaWarningResult,
  type ProjectQuotaWarnings,
  type QuotaData,
  type UsageData,
  type WarningLevelCalculation,
  type QuotaWarningEmail,
  type QuotaWarningJobSummary,
  type CheckAllProjectsResult,

  // Constants
  WARNING_THRESHOLD_80,
  WARNING_THRESHOLD_90,
  MONITORED_SERVICES,
  SERVICES_COUNT_PER_PROJECT,
  getWarningUrgency,
  getWarningThreshold,

  // Calculator functions
  calculateWarningLevel,
  calculateUsagePercentage,
  calculateWarningLevelResult,
  isAboveWarningThreshold,
  isAboveCriticalThreshold,
  shouldShowWarning,

  // Monitor functions
  getQuotaData,
  getCurrentUsage,
  getAllQuotaData,
  calculateServiceWarningLevel,
  getProjectName,
  getActiveProjects,
  getProjectQuotaWarnings,

  // Sender functions
  createQuotaWarningEmail,
  sendQuotaWarning,

  // Main orchestration functions
  checkAndSendQuotaWarning,
  checkAllServicesForQuotaWarnings,
  checkAllProjectsForQuotaWarnings,
} from './quota-warnings'

/**
 * Error Rate Detection Library
 *
 * Detects high error rates that may indicate abuse, DDoS attacks, or system issues.
 * Calculates error rate as (error_count / total_requests) * 100.
 *
 * Usage:
 * - Call runErrorRateDetection() from a background job (e.g., every hour)
 * - The function will check all projects for high error rates
 * - Actions are taken based on error rate severity (warning or investigation)
 *
 * @module error-rate-detection
 */

// Re-export all types, utilities, and functions for error rate detection
export {
  // Types
  type ErrorRateDetectionJobResult,

  // Detection functions
  calculateErrorRate,
  detectHighErrorRate,
  checkProjectForHighErrorRate,
  checkAllProjectsForHighErrorRates,

  // Main job
  runErrorRateDetection,

  // Metrics
  getErrorRateDetectionConfig,
  getErrorRateDetectionHistory,
  checkProjectErrorRateStatus,
  recordErrorMetrics,
  getErrorRateDetectionSummary,
} from './error-rate-detection'

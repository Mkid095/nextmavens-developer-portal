/**
 * Error Rate Detection Index
 * Re-exports all types, utilities, and functions for error rate detection
 */

// Types
export type { ErrorRateDetectionJobResult } from './types'

// Detection functions
export {
  calculateErrorRate,
  detectHighErrorRate,
  checkProjectForHighErrorRate,
  checkAllProjectsForHighErrorRates,
} from './detection'

// Job
export { runErrorRateDetection } from './job'

// Metrics
export {
  getErrorRateDetectionConfig,
  getErrorRateDetectionHistory,
  checkProjectErrorRateStatus,
  recordErrorMetrics,
  getErrorRateDetectionSummary,
} from './metrics'

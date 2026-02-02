/**
 * Error Rate Detection Types
 * Types for error rate detection and management
 */

/**
 * Error rate severity levels
 */
export enum ErrorRateSeverity {
  /** Warning level - elevated error rate (30-50%) */
  WARNING = 'warning',
  /** Critical level - high error rate (50-75%) */
  CRITICAL = 'critical',
  /** Severe level - extreme error rate (75%+) */
  SEVERE = 'severe',
}

/**
 * Error rate action types
 */
export enum ErrorRateAction {
  /** Log a warning but take no action */
  WARNING = 'warning',
  /** Trigger investigation */
  INVESTIGATE = 'investigate',
  /** No action needed */
  NONE = 'none',
}

/**
 * Error rate detection configuration
 */
export interface ErrorRateDetectionConfig {
  /** Error rate threshold percentage (default: 50) */
  thresholdPercentage: number
  /** Time window for error rate calculation in milliseconds */
  windowDurationMs: number
  /** Minimum number of requests to consider for error rate detection */
  minRequestsThreshold: number
  /** Whether error rate detection is enabled */
  enabled: boolean
}

/**
 * Error rate detection result
 */
export interface ErrorRateDetectionResult {
  /** Project ID that was checked */
  projectId: string
  /** Whether a high error rate was detected */
  errorRateDetected: boolean
  /** Error rate percentage (0-100) */
  errorRate: number
  /** Total number of requests */
  totalRequests: number
  /** Number of errors */
  errorCount: number
  /** Severity level of the detected error rate */
  severity: ErrorRateSeverity
  /** Action that should be taken */
  recommendedAction: ErrorRateAction
  /** Timestamp when the error rate was detected */
  detectedAt: Date
  /** Additional details or context */
  details?: string
}

/**
 * Error rate detection background job result
 */
export interface ErrorRateDetectionJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of projects checked */
  projectsChecked: number
  /** Number of high error rates detected */
  errorRatesDetected: number
  /** Details of detected error rates */
  detectedErrorRates: ErrorRateDetectionResult[]
  /** Breakdown by action type */
  actionsTaken: {
    warnings: number
    investigations: number
  }
  /** Error message if job failed */
  error?: string
}

/**
 * Error metric record for database storage
 */
export interface ErrorMetric {
  /** Unique identifier */
  id: string
  /** Project ID */
  project_id: string
  /** Number of requests */
  request_count: number
  /** Number of errors */
  error_count: number
  /** When the metric was recorded */
  recorded_at: Date
}

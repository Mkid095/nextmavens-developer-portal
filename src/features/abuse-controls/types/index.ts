/**
 * Abuse Control Types
 * Defines hard caps and quota management for project abuse prevention
 */

/**
 * Hard cap types that can be enforced per project
 */
export enum HardCapType {
  /** Database queries per day */
  DB_QUERIES_PER_DAY = 'db_queries_per_day',
  /** Realtime connections */
  REALTIME_CONNECTIONS = 'realtime_connections',
  /** Storage uploads per day */
  STORAGE_UPLOADS_PER_DAY = 'storage_uploads_per_day',
  /** Function invocations per day */
  FUNCTION_INVOCATIONS_PER_DAY = 'function_invocations_per_day',
}

/**
 * Default hard cap values
 */
export const DEFAULT_HARD_CAPS: Record<HardCapType, number> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 10_000,
  [HardCapType.REALTIME_CONNECTIONS]: 100,
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 1_000,
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 5_000,
} as const

/**
 * Quota configuration for a project
 */
export interface ProjectQuota {
  id: string
  project_id: string
  cap_type: HardCapType
  cap_value: number
  created_at: Date
  updated_at: Date
}

/**
 * Hard cap configuration
 */
export interface HardCapConfig {
  type: HardCapType
  value: number
}

/**
 * Current usage statistics for a project
 */
export interface ProjectUsage {
  project_id: string
  db_queries_today: number
  realtime_connections: number
  storage_uploads_today: number
  function_invocations_today: number
}

/**
 * Quota violation result
 */
export interface QuotaViolation {
  project_id: string
  cap_type: HardCapType
  current_value: number
  cap_limit: number
  exceeded_at: Date
}

/**
 * Rate limit identifier types
 */
export enum RateLimitIdentifierType {
  /** Organization-based rate limiting */
  ORG = 'org',
  /** IP-based rate limiting */
  IP = 'ip',
}

/**
 * Rate limit identifier
 */
export interface RateLimitIdentifier {
  type: RateLimitIdentifierType
  value: string
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetAt: Date
}

/**
 * Rate limit error details
 */
export interface RateLimitError {
  identifier: RateLimitIdentifier
  limit: number
  windowMs: number
  retryAfterSeconds: number
  resetAt: Date
}

/**
 * Project status enum
 */
export enum ProjectStatus {
  /** Project is active and operational */
  ACTIVE = 'active',
  /** Project is suspended due to cap violations or abuse */
  SUSPENDED = 'suspended',
}

/**
 * Suspension reason details
 */
export interface SuspensionReason {
  /** The type of cap that was exceeded */
  cap_type: HardCapType
  /** Current usage value */
  current_value: number
  /** The limit that was exceeded */
  limit_exceeded: number
  /** Additional context about the suspension */
  details?: string
}

/**
 * Suspension record for tracking project suspensions
 */
export interface SuspensionRecord {
  /** Unique identifier for the suspension */
  id: string
  /** Project ID that was suspended */
  project_id: string
  /** Reason for suspension */
  reason: SuspensionReason
  /** The specific cap that was exceeded */
  cap_exceeded: HardCapType
  /** When the suspension was applied */
  suspended_at: Date
  /** When the suspension was resolved (null if still suspended) */
  resolved_at: Date | null
  /** Optional notes about the suspension */
  notes?: string
}

/**
 * Suspension history entry for audit trail
 */
export interface SuspensionHistoryEntry {
  /** Unique identifier for the history entry */
  id: string
  /** Project ID */
  project_id: string
  /** Action taken (suspended/unsuspended) */
  action: 'suspended' | 'unsuspended'
  /** Reason for the action */
  reason: SuspensionReason
  /** When the action occurred */
  occurred_at: Date
  /** Optional notes about the action */
  notes?: string
}

/**
 * Usage spike detection result
 */
export interface UsageSpikeDetection {
  /** Project ID where spike was detected */
  project_id: string
  /** The cap type that spiked */
  cap_type: HardCapType
  /** Average usage over baseline period */
  average_usage: number
  /** Current usage in detection window */
  current_usage: number
  /** Spike multiplier (e.g., 3x average) */
  spike_multiplier: number
  /** Severity level of the spike */
  severity: SpikeSeverity
  /** When the spike was detected */
  detected_at: Date
  /** Whether action was taken (warning/suspension) */
  action_taken: 'warning' | 'suspension' | 'none'
}

/**
 * Usage statistics for a project over a time period
 */
export interface UsageStatistics {
  /** Project ID */
  project_id: string
  /** The cap type being measured */
  cap_type: HardCapType
  /** Total usage in the time period */
  total_usage: number
  /** Average usage per time unit */
  average_usage: number
  /** Peak usage in the time period */
  peak_usage: number
  /** Time period start */
  period_start: Date
  /** Time period end */
  period_end: Date
}

/**
 * Spike severity levels
 * Classifies the severity of a detected usage spike
 */
export enum SpikeSeverity {
  /** Warning level - moderate spike (3x-5x average) */
  WARNING = 'warning',
  /** Critical level - severe spike (5x-10x average) */
  CRITICAL = 'critical',
  /** Severe level - extreme spike (10x+ average) */
  SEVERE = 'severe',
}

/**
 * Spike detection action types
 */
export enum SpikeAction {
  /** Log a warning but take no action */
  WARNING = 'warning',
  /** Suspend the project immediately */
  SUSPEND = 'suspend',
  /** No action needed */
  NONE = 'none',
}

/**
 * Spike detection configuration
 */
export interface SpikeDetectionConfig {
  /** Threshold multiplier for spike detection (e.g., 3.0 = 3x average) */
  thresholdMultiplier: number
  /** Time window to check for spikes in milliseconds */
  windowDurationMs: number
  /** Baseline period to calculate average usage in milliseconds */
  baselinePeriodMs: number
  /** Minimum usage threshold to consider for spike detection */
  minUsageThreshold: number
  /** Action to take when a spike is detected */
  action: SpikeAction
  /** Whether spike detection is enabled */
  enabled: boolean
}

/**
 * Spike detection result
 */
export interface SpikeDetectionResult {
  /** Project ID that was checked */
  projectId: string
  /** The cap type that was checked */
  capType: HardCapType
  /** Whether a spike was detected */
  spikeDetected: boolean
  /** Current usage in the detection window */
  currentUsage: number
  /** Average usage over the baseline period */
  averageUsage: number
  /** Spike multiplier (currentUsage / averageUsage) */
  spikeMultiplier: number
  /** Severity level of the detected spike */
  severity: SpikeSeverity
  /** Action that was taken (if any) */
  actionTaken: SpikeAction
  /** Timestamp when the spike was detected */
  detectedAt: Date
  /** Additional details or context */
  details?: string
}

/**
 * Usage metric record for database storage
 */
export interface UsageMetric {
  /** Unique identifier */
  id: string
  /** Project ID */
  project_id: string
  /** Type of metric */
  metric_type: string
  /** Value of the metric */
  metric_value: number
  /** When the metric was recorded */
  recorded_at: Date
}

/**
 * Spike detection background job result
 */
export interface SpikeDetectionJobResult {
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
  /** Number of spikes detected */
  spikesDetected: number
  /** Details of detected spikes */
  detectedSpikes: SpikeDetectionResult[]
  /** Breakdown by action type */
  actionsTaken: {
    warnings: number
    suspensions: number
  }
  /** Error message if job failed */
  error?: string
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

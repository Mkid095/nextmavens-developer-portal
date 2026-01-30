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
 * Suspension type enum
 * PRD: US-010 - Implement Auto-Status Transitions
 */
export enum SuspensionType {
  /** Suspended manually by a platform operator */
  MANUAL = 'manual',
  /** Suspended automatically by the background job for quota violations */
  AUTOMATIC = 'automatic',
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
  /** Type of suspension (manual or automatic) */
  suspension_type?: SuspensionType
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

/**
 * Malicious pattern types that can be detected
 */
export enum MaliciousPatternType {
  /** SQL injection attempts in queries */
  SQL_INJECTION = 'sql_injection',
  /** Authentication brute force attacks */
  AUTH_BRUTE_FORCE = 'auth_brute_force',
  /** Rapid sequential API key creation */
  RAPID_KEY_CREATION = 'rapid_key_creation',
}

/**
 * Malicious pattern severity levels
 */
export enum PatternSeverity {
  /** Warning level - pattern detected but may be legitimate */
  WARNING = 'warning',
  /** Critical level - highly suspicious activity */
  CRITICAL = 'critical',
  /** Severe level - clear malicious intent */
  SEVERE = 'severe',
}

/**
 * Malicious pattern detection result
 */
export interface PatternDetectionResult {
  /** Project ID where pattern was detected */
  project_id: string
  /** Type of malicious pattern detected */
  pattern_type: MaliciousPatternType
  /** Severity level of the detected pattern */
  severity: PatternSeverity
  /** Number of pattern occurrences detected */
  occurrence_count: number
  /** Time window in which pattern was detected */
  detection_window_ms: number
  /** When the pattern was detected */
  detected_at: Date
  /** Description of what was detected */
  description: string
  /** Evidence/context of the pattern detection */
  evidence?: string[]
  /** Whether action was taken (warning/suspension) */
  action_taken: 'warning' | 'suspension' | 'none'
}

/**
 * SQL injection pattern configuration
 */
export interface SQLInjectionPatternConfig {
  /** Whether SQL injection detection is enabled */
  enabled: boolean
  /** Minimum number of suspicious queries to trigger detection */
  min_occurrences: number
  /** Time window for detection in milliseconds */
  detection_window_ms: number
  /** Whether to trigger suspension on detection */
  suspend_on_detection: boolean
}

/**
 * Auth brute force pattern configuration
 */
export interface AuthBruteForcePatternConfig {
  /** Whether brute force detection is enabled */
  enabled: boolean
  /** Minimum number of failed auth attempts to trigger detection */
  min_failed_attempts: number
  /** Time window for detection in milliseconds */
  detection_window_ms: number
  /** Whether to trigger suspension on detection */
  suspend_on_detection: boolean
}

/**
 * Rapid key creation pattern configuration
 */
export interface RapidKeyCreationPatternConfig {
  /** Whether rapid key creation detection is enabled */
  enabled: boolean
  /** Minimum number of keys created to trigger detection */
  min_keys_created: number
  /** Time window for detection in milliseconds */
  detection_window_ms: number
  /** Whether to trigger suspension on detection */
  suspend_on_detection: boolean
}

/**
 * Malicious pattern detection configuration
 */
export interface PatternDetectionConfig {
  /** SQL injection pattern configuration */
  sql_injection: SQLInjectionPatternConfig
  /** Auth brute force pattern configuration */
  auth_brute_force: AuthBruteForcePatternConfig
  /** Rapid key creation pattern configuration */
  rapid_key_creation: RapidKeyCreationPatternConfig
}

/**
 * Pattern detection background job result
 */
export interface PatternDetectionJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  started_at: Date
  /** Timestamp when the job completed */
  completed_at: Date
  /** Duration in milliseconds */
  duration_ms: number
  /** Number of projects checked */
  projects_checked: number
  /** Number of patterns detected */
  patterns_detected: number
  /** Details of detected patterns */
  detected_patterns: PatternDetectionResult[]
  /** Breakdown by pattern type */
  patterns_by_type: {
    sql_injection: number
    auth_brute_force: number
    rapid_key_creation: number
  }
  /** Breakdown by action type */
  actions_taken: {
    warnings: number
    suspensions: number
  }
  /** Error message if job failed */
  error?: string
}

/**
 * Pattern match result for individual checks
 */
export interface PatternMatchResult {
  /** Whether the pattern was matched */
  matched: boolean
  /** Confidence score (0-1) of the match */
  confidence: number
  /** Details about what was matched */
  details?: string
  /** Evidence of the pattern match */
  evidence?: string[]
}

/**
 * Notification types for system events
 */
export enum NotificationType {
  /** Project suspended notification */
  PROJECT_SUSPENDED = 'project_suspended',
  /** Project unsuspended notification */
  PROJECT_UNSUSPENDED = 'project_unsuspended',
  /** Quota warning notification */
  QUOTA_WARNING = 'quota_warning',
  /** Usage spike detected notification */
  USAGE_SPIKE_DETECTED = 'usage_spike_detected',
  /** Error rate detected notification */
  ERROR_RATE_DETECTED = 'error_rate_detected',
  /** Malicious pattern detected notification */
  MALICIOUS_PATTERN_DETECTED = 'malicious_pattern_detected',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  /** Low priority - informational */
  LOW = 'low',
  /** Medium priority - requires attention */
  MEDIUM = 'medium',
  /** High priority - immediate action required */
  HIGH = 'high',
  /** Critical priority - service impacting */
  CRITICAL = 'critical',
}

/**
 * Notification delivery status
 */
export enum NotificationStatus {
  /** Notification is pending delivery */
  PENDING = 'pending',
  /** Notification was successfully delivered */
  DELIVERED = 'delivered',
  /** Notification delivery failed */
  FAILED = 'failed',
  /** Notification is being retried */
  RETRYING = 'retrying',
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  /** Email notification */
  EMAIL = 'email',
  /** In-app notification */
  IN_APP = 'in_app',
  /** SMS notification */
  SMS = 'sms',
  /** Webhook notification */
  WEBHOOK = 'webhook',
}

/**
 * Notification recipient information
 */
export interface NotificationRecipient {
  /** Recipient ID (user or org member ID) */
  id: string
  /** Recipient email address */
  email: string
  /** Recipient name */
  name?: string
  /** Recipient role in the organization */
  role?: string
}

/**
 * Notification record for database storage
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string
  /** Project ID associated with the notification */
  project_id: string
  /** Type of notification */
  notification_type: NotificationType
  /** Priority level of the notification */
  priority: NotificationPriority
  /** Notification subject/title */
  subject: string
  /** Notification body content */
  body: string
  /** Additional data associated with the notification */
  data: Record<string, unknown>
  /** Delivery channels to use */
  channels: NotificationChannel[]
  /** Current delivery status */
  status: NotificationStatus
  /** Number of delivery attempts made */
  attempts: number
  /** Timestamp when the notification was created */
  created_at: Date
  /** Timestamp when the notification was delivered */
  delivered_at?: Date
  /** Error message if delivery failed */
  error_message?: string
}

/**
 * Notification template for suspension notifications
 */
export interface SuspensionNotificationTemplate {
  /** Project name */
  project_name: string
  /** Organization name */
  org_name: string
  /** Suspension reason */
  reason: SuspensionReason
  /** When the suspension occurred */
  suspended_at: Date
  /** Support contact information */
  support_contact: string
  /** Resolution steps */
  resolution_steps: string[]
}

/**
 * Notification delivery result
 */
export interface NotificationDeliveryResult {
  /** Whether the delivery was successful */
  success: boolean
  /** Notification ID */
  notification_id: string
  /** Delivery channel used */
  channel: NotificationChannel
  /** Timestamp of delivery attempt */
  delivered_at: Date
  /** Error message if delivery failed */
  error?: string
  /** Number of attempts made */
  attempts: number
}

/**
 * Suspension notification type
 * Distinguishes between actual suspensions and warning notifications
 */
export enum SuspensionNotificationType {
  /** Project has been suspended */
  SUSPENSION = 'suspension',
  /** Warning about approaching limits */
  WARNING = 'warning',
}

/**
 * Suspension notification delivery status
 */
export enum SuspensionNotificationStatus {
  /** Notification is pending delivery */
  PENDING = 'pending',
  /** Notification has been sent */
  SENT = 'sent',
  /** Notification delivery failed */
  FAILED = 'failed',
}

/**
 * Suspension notification record
 * Tracks suspension notifications sent to project owners
 */
export interface SuspensionNotification {
  /** Unique identifier for the notification */
  id: string
  /** Project ID that was suspended */
  project_id: string
  /** Recipient email addresses */
  recipient_emails: string[]
  /** Reason for suspension */
  reason: string
  /** Which hard cap was exceeded */
  cap_exceeded: string
  /** Current usage value */
  current_usage: number
  /** The limit that was exceeded */
  limit: number
  /** Support contact information */
  support_contact: string
  /** Current delivery status */
  status: SuspensionNotificationStatus
  /** When the notification was sent */
  sent_at: Date | null
  /** Error message if delivery failed */
  error: string | null
  /** When the notification was created */
  created_at: Date
}

/**
 * Parameters for sending a suspension notification
 */
export interface SuspensionNotificationParams {
  /** Project ID that was suspended */
  projectId: string
  /** Recipient email addresses */
  recipientEmails: string[]
  /** Reason for suspension */
  reason: string
  /** Which hard cap was exceeded */
  capExceeded: string
  /** Current usage value */
  currentUsage: number
  /** The limit that was exceeded */
  limit: number
  /** Support contact information */
  supportContact: string
}

/**
 * Manual override action types
 * Defines the types of manual overrides that can be performed
 */
export enum ManualOverrideAction {
  /** Unsuspend a suspended project */
  UNSUSPEND = 'unsuspend',
  /** Increase hard caps for a project */
  INCREASE_CAPS = 'increase_caps',
  /** Both unsuspend and increase caps */
  BOTH = 'both',
}

/**
 * Manual override request parameters
 * Required input for performing a manual override
 */
export interface ManualOverrideRequest {
  /** Project ID to override */
  projectId: string
  /** Action to perform (unsuspend, increase caps, or both) */
  action: ManualOverrideAction
  /** Reason for the override (required for audit) */
  reason: string
  /** Optional new cap values to set */
  newCaps?: Partial<Record<HardCapType, number>>
  /** Optional additional notes or context */
  notes?: string
}

/**
 * Previous state snapshot for audit purposes
 */
export interface PreviousStateSnapshot {
  /** Previous project status */
  previousStatus: ProjectStatus
  /** Previous cap values */
  previousCaps: Record<HardCapType, number>
  /** Whether project was suspended */
  wasSuspended: boolean
}

/**
 * Manual override result
 * Result returned after performing a manual override
 */
export interface ManualOverrideResult {
  /** Whether the override was successful */
  success: boolean
  /** The override record that was created */
  overrideRecord: OverrideRecord
  /** Previous state before the override */
  previousState: PreviousStateSnapshot
  /** Current state after the override */
  currentState: {
    /** New project status */
    status: ProjectStatus
    /** New cap values (if changed) */
    caps?: Record<HardCapType, number>
  }
  /** Error message if override failed */
  error?: string
}

/**
 * Override record for database storage
 * Tracks manual overrides performed by administrators
 */
export interface OverrideRecord {
  /** Unique identifier for the override */
  id: string
  /** Project ID that was overridden */
  project_id: string
  /** Action that was performed */
  action: ManualOverrideAction
  /** Reason for the override */
  reason: string
  /** Additional notes or context */
  notes?: string
  /** Previous cap values before override */
  previous_caps: Record<HardCapType, number>
  /** New cap values after override (if changed) */
  new_caps?: Record<HardCapType, number>
  /** User ID who performed the override */
  performed_by: string
  /** When the override was performed */
  performed_at: Date
  /** IP address of the performer (if available) */
  ip_address?: string
  /** Previous project status */
  previous_status: ProjectStatus
  /** New project status after override */
  new_status: ProjectStatus
}

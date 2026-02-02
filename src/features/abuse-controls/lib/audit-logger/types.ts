/**
 * Audit Logger Module - Type Definitions
 */

/**
 * Audit log entry types
 */
export enum AuditLogType {
  /** Suspension action */
  SUSPENSION = 'suspension',
  /** Unsuspension action */
  UNSUSPENSION = 'unsuspension',
  /** Authorization failure */
  AUTH_FAILURE = 'auth_failure',
  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  /** Validation failure */
  VALIDATION_FAILURE = 'validation_failure',
  /** Background job execution */
  BACKGROUND_JOB = 'background_job',
  /** Manual intervention */
  MANUAL_INTERVENTION = 'manual_intervention',
  /** Feature flag enabled */
  FEATURE_FLAG_ENABLED = 'feature_flag.enabled',
  /** Feature flag disabled */
  FEATURE_FLAG_DISABLED = 'feature_flag.disabled',
}

/**
 * Audit log severity levels
 */
export enum AuditLogLevel {
  /** Informational - normal operations */
  INFO = 'info',
  /** Warning - potential issues */
  WARNING = 'warning',
  /** Error - operation failures */
  ERROR = 'error',
  /** Critical - security concerns */
  CRITICAL = 'critical',
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id?: string
  log_type: AuditLogType
  severity: AuditLogLevel
  project_id?: string
  developer_id?: string
  action: string
  details: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  occurred_at: Date
}

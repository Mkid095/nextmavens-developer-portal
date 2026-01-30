/**
 * Security Audit Logger
 *
 * Provides comprehensive logging for security-sensitive operations.
 * Logs all suspension actions, authorization failures, and errors.
 */

import { getPool } from '@/lib/db'

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

/**
 * Log an audit entry to the database and console
 *
 * @param entry - The audit log entry to record
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  const pool = getPool()

  try {
    // Log to database for permanent record
    await pool.query(
      `
      INSERT INTO audit_logs (
        log_type,
        severity,
        project_id,
        developer_id,
        action,
        details,
        ip_address,
        user_agent,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        entry.log_type,
        entry.severity,
        entry.project_id || null,
        entry.developer_id || null,
        entry.action,
        JSON.stringify(entry.details),
        entry.ip_address || null,
        entry.user_agent || null,
        entry.occurred_at,
      ]
    )

    // Also log to console for immediate visibility
    const consoleMessage = `[Audit] ${entry.severity.toUpperCase()} ${entry.log_type}: ${entry.action}`
    const consoleDetails = {
      projectId: entry.project_id,
      developerId: entry.developer_id,
      ...entry.details,
    }

    switch (entry.severity) {
      case AuditLogLevel.CRITICAL:
        console.error(consoleMessage, consoleDetails)
        break
      case AuditLogLevel.ERROR:
        console.error(consoleMessage, consoleDetails)
        break
      case AuditLogLevel.WARNING:
        console.warn(consoleMessage, consoleDetails)
        break
      default:
        console.log(consoleMessage, consoleDetails)
    }
  } catch (error) {
    console.error('[Audit Logger] Failed to log audit entry:', error)
    // Don't throw - logging failure shouldn't break the application
  }
}

/**
 * Log a suspension action
 *
 * @param projectId - The project being suspended
 * @param developerId - The developer performing the suspension
 * @param reason - The reason for suspension
 * @param metadata - Additional metadata
 */
export async function logSuspension(
  projectId: string,
  developerId: string,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.SUSPENSION,
    severity: AuditLogLevel.WARNING,
    project_id: projectId,
    developer_id: developerId,
    action: 'Project suspended',
    details: {
      reason,
      ...metadata,
    },
    occurred_at: new Date(),
  })
}

/**
 * Log an unsuspension action
 *
 * @param projectId - The project being unsuspended
 * @param developerId - The developer performing the unsuspension
 * @param reason - The reason for unsuspension
 * @param metadata - Additional metadata
 */
export async function logUnsuspension(
  projectId: string,
  developerId: string,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.UNSUSPENSION,
    severity: AuditLogLevel.INFO,
    project_id: projectId,
    developer_id: developerId,
    action: 'Project unsuspended',
    details: {
      reason,
      ...metadata,
    },
    occurred_at: new Date(),
  })
}

/**
 * Log an authorization failure
 *
 * @param developerId - The developer who failed authorization
 * @param action - The action they attempted
 * @param reason - The reason for failure
 * @param projectId - Optional project ID
 * @param ipAddress - Optional IP address
 */
export async function logAuthFailure(
  developerId: string | null,
  action: string,
  reason: string,
  projectId?: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.AUTH_FAILURE,
    severity: AuditLogLevel.WARNING,
    project_id: projectId,
    developer_id: developerId || undefined,
    action,
    details: {
      reason,
    },
    ip_address: ipAddress,
    occurred_at: new Date(),
  })
}

/**
 * Log a rate limit exceeded event
 *
 * @param identifier - The identifier that was rate limited
 * @param action - The action being rate limited
 * @param limit - The limit that was exceeded
 * @param ipAddress - Optional IP address
 */
export async function logRateLimitExceeded(
  identifier: string,
  action: string,
  limit: number,
  ipAddress?: string
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.RATE_LIMIT_EXCEEDED,
    severity: AuditLogLevel.WARNING,
    action,
    details: {
      identifier,
      limit,
    },
    ip_address: ipAddress,
    occurred_at: new Date(),
  })
}

/**
 * Log a validation failure
 *
 * @param action - The action being validated
 * @param reason - The validation error
 * @param metadata - Additional metadata
 */
export async function logValidationFailure(
  action: string,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.VALIDATION_FAILURE,
    severity: AuditLogLevel.INFO,
    action,
    details: {
      reason,
      ...metadata,
    },
    occurred_at: new Date(),
  })
}

/**
 * Log a background job execution
 *
 * @param jobName - The name of the background job
 * @param success - Whether the job succeeded
 * @param metadata - Job metadata (duration, projects checked, etc.)
 */
export async function logBackgroundJob(
  jobName: string,
  success: boolean,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.BACKGROUND_JOB,
    severity: success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
    action: `Background job: ${jobName}`,
    details: {
      success,
      ...metadata,
    },
    occurred_at: new Date(),
  })
}

/**
 * Log a manual intervention (operator action)
 *
 * @param projectId - The project being affected
 * @param developerId - The operator performing the action
 * @param action - The action performed
 * @param metadata - Additional metadata
 */
export async function logManualIntervention(
  projectId: string,
  developerId: string,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.MANUAL_INTERVENTION,
    severity: AuditLogLevel.INFO,
    project_id: projectId,
    developer_id: developerId,
    action,
    details: metadata,
    occurred_at: new Date(),
  })
}

/**
 * Extract IP address from request headers
 *
 * @param req - The NextRequest object
 * @returns The client IP address
 */
export function extractClientIP(req: Request): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Try cf-connecting-ip header (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  // Try x-real-ip header (Nginx)
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a default
  return '0.0.0.0'
}

/**
 * Extract user agent from request headers
 *
 * @param req - The NextRequest object
 * @returns The user agent string
 */
export function extractUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'Unknown'
}

/**
 * Log a feature flag enabled action
 *
 * @param flagName - The name of the feature flag
 * @param developerId - The developer who enabled the flag
 * @param oldValue - The previous value of the flag
 * @param scope - The scope of the flag (global, project, org)
 * @param scopeId - The ID of the project or org (for non-global scopes)
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 */
export async function logFeatureFlagEnabled(
  flagName: string,
  developerId: string,
  oldValue: boolean,
  scope: string,
  scopeId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.FEATURE_FLAG_ENABLED,
    severity: AuditLogLevel.INFO,
    developer_id: developerId,
    action: 'Feature flag enabled',
    details: {
      flag_name: flagName,
      old_value: oldValue,
      new_value: true,
      scope,
      scope_id: scopeId || null,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
    occurred_at: new Date(),
  })
}

/**
 * Log a feature flag disabled action
 *
 * @param flagName - The name of the feature flag
 * @param developerId - The developer who disabled the flag
 * @param oldValue - The previous value of the flag
 * @param scope - The scope of the flag (global, project, org)
 * @param scopeId - The ID of the project or org (for non-global scopes)
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 */
export async function logFeatureFlagDisabled(
  flagName: string,
  developerId: string,
  oldValue: boolean,
  scope: string,
  scopeId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEntry({
    log_type: AuditLogType.FEATURE_FLAG_DISABLED,
    severity: AuditLogLevel.WARNING,
    developer_id: developerId,
    action: 'Feature flag disabled',
    details: {
      flag_name: flagName,
      old_value: oldValue,
      new_value: false,
      scope,
      scope_id: scopeId || null,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
    occurred_at: new Date(),
  })
}

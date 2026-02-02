/**
 * Audit Logger Module - Specialized Logging Functions
 */

import { logAuditEntry } from './logger'
import { AuditLogType, AuditLogLevel } from './types'

/**
 * Log a suspension action
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
 * Log a feature flag enabled action
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

/**
 * Audit Logger - Core Functions
 *
 * US-008: Add Correlation ID to Audit Logs
 * US-011: Local sanitization functions for audit logging
 */

import { getPool } from '@/lib/db'
import type { AuditLogEntry, AuditLogFromRequest } from './types'
import { sanitizeAuditMetadata, redactSecretPatterns } from './sanitization'

/**
 * Log an audit entry to control_plane.audit_logs
 *
 * US-008: Request ID captured from x-request-id header
 *
 * @param entry - The audit log entry to record
 * @returns The created audit log ID
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<string> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO control_plane.audit_logs (
        actor_id,
        actor_type,
        action,
        target_type,
        target_id,
        metadata,
        ip_address,
        user_agent,
        request_id,
        project_id,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id
      `,
      [
        entry.actor_id,
        entry.actor_type,
        entry.action,
        entry.target_type,
        entry.target_id,
        JSON.stringify(entry.metadata || {}),
        entry.ip_address || null,
        entry.user_agent || null,
        entry.request_id || null,
        entry.project_id || null,
      ]
    )

    const auditLogId = result.rows[0].id

    // US-011: Sanitize metadata before logging to console to prevent secret leakage
    const safeMetadata = sanitizeAuditMetadata(entry.metadata)

    // Log to console for immediate visibility
    console.log(`[Audit] ${entry.actor_type}:${entry.actor_id} -> ${entry.action} on ${entry.target_type}:${entry.target_id}`, {
      auditLogId,
      requestId: entry.request_id,
      projectId: entry.project_id,
      metadata: safeMetadata,
    })

    return auditLogId
  } catch (error) {
    // US-011: Redact potential secrets from error messages
    const errorMessage = error instanceof Error ? error.message : String(error)
    const safeErrorMessage = redactSecretPatterns(errorMessage)
    console.error('[Audit Logger] Failed to log audit entry:', safeErrorMessage)
    throw error
  }
}

/**
 * Query audit logs by request_id
 *
 * US-008: Can query all audit entries for a request
 *
 * @param requestId - The correlation ID to query
 * @param projectId - Optional project ID for filtering
 * @returns Array of audit log entries
 */
export async function getAuditLogsByRequestId(
  requestId: string,
  projectId?: string
): Promise<Record<string, unknown>[]> {
  const pool = getPool()

  try {
    const conditions = ['request_id = $1']
    const values = [requestId]
    let paramIndex = 2

    if (projectId) {
      conditions.push(`project_id = $${paramIndex++}`)
      values.push(projectId)
    }

    const result = await pool.query(
      `
      SELECT
        id, actor_id, actor_type, action,
        target_type, target_id, metadata,
        ip_address, user_agent, request_id,
        project_id, created_at
      FROM control_plane.audit_logs
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at ASC
      `,
      values
    )

    return result.rows
  } catch (error) {
    console.error('[Audit Logger] Failed to query audit logs:', error)
    throw error
  }
}

/**
 * Log an audit entry from a NextRequest
 *
 * Convenience function that extracts IP, user agent, and correlation ID
 * from the request automatically.
 *
 * US-008: Request ID captured from x-request-id header
 *
 * @param req - NextRequest object
 * @param entry - Audit log entry (request_id, ip_address, user_agent are auto-filled)
 * @returns The created audit log ID
 */
export async function logAuditFromRequest(
  req: Request,
  entry: AuditLogFromRequest
): Promise<string> {
  const { extractRequestId, extractIpAddress, extractUserAgent } = await import('./request-extractors')
  const nextReq = req as any as NextRequest

  return logAuditEntry({
    ...entry,
    ip_address: extractIpAddress(nextReq),
    user_agent: extractUserAgent(nextReq),
    request_id: extractRequestId(nextReq) || undefined,
  })
}

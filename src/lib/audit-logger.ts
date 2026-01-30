/**
 * Unified Audit Logger
 *
 * US-008: Add Correlation ID to Audit Logs
 *
 * Provides comprehensive audit logging using the control_plane.audit_logs schema.
 * Captures correlation ID from x-request-id header for request tracing.
 *
 * Schema: control_plane.audit_logs
 * - id (UUID PRIMARY KEY)
 * - actor_id (UUID)
 * - actor_type (VARCHAR: 'user', 'system', 'api_key', 'project')
 * - action (VARCHAR)
 * - target_type (VARCHAR)
 * - target_id (UUID)
 * - metadata (JSONB)
 * - ip_address (INET)
 * - user_agent (TEXT)
 * - request_id (UUID) - Correlation ID for request tracing
 * - project_id (UUID REFERENCES projects(id))
 * - created_at (TIMESTAMPTZ)
 */

import { getPool } from '@/lib/db'
import { extractCorrelationId, generateCorrelationId } from '@/lib/middleware/correlation'
import type { NextRequest } from 'next/server'

/**
 * Audit actor types
 */
export type AuditActorType = 'user' | 'system' | 'api_key' | 'project' | 'mcp_token'

/**
 * Target entity types
 */
export type AuditTargetType = 'project' | 'api_key' | 'user' | 'secret' | 'feature_flag' | 'suspension' | 'quota'

/**
 * Unified audit log entry structure
 * Matches control_plane.audit_logs table schema
 */
export interface AuditLogEntry {
  actor_id: string
  actor_type: AuditActorType
  action: string
  target_type: AuditTargetType
  target_id: string
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  request_id?: string // Correlation ID from x-request-id header
  project_id?: string
}

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

    // Log to console for immediate visibility
    console.log(`[Audit] ${entry.actor_type}:${entry.actor_id} -> ${entry.action} on ${entry.target_type}:${entry.target_id}`, {
      auditLogId,
      requestId: entry.request_id,
      projectId: entry.project_id,
      metadata: entry.metadata,
    })

    return auditLogId
  } catch (error) {
    console.error('[Audit Logger] Failed to log audit entry:', error)
    throw error
  }
}

/**
 * Extract correlation ID from request for audit logging
 *
 * US-008: Request ID captured from x-request-id header
 *
 * @param req - NextRequest object
 * @returns The correlation ID or null
 */
export function extractRequestId(req: NextRequest): string | null {
  return extractCorrelationId(req)
}

/**
 * Generate a new correlation ID for audit logging
 *
 * @returns A new UUID string
 */
export function generateRequestId(): string {
  return generateCorrelationId()
}

/**
 * Extract IP address from request
 *
 * @param req - NextRequest object
 * @returns The client IP address
 */
export function extractIpAddress(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return '0.0.0.0'
}

/**
 * Extract user agent from request
 *
 * @param req - NextRequest object
 * @returns The user agent string
 */
export function extractUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'Unknown'
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
  req: NextRequest,
  entry: Omit<AuditLogEntry, 'ip_address' | 'user_agent' | 'request_id'>
): Promise<string> {
  return logAuditEntry({
    ...entry,
    ip_address: extractIpAddress(req),
    user_agent: extractUserAgent(req),
    request_id: extractRequestId(req) || undefined,
  })
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

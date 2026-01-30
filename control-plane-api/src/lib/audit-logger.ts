/**
 * Control Plane API Audit Logger
 * PRD: US-012 from prd-secrets-versioning.json
 *
 * Provides audit logging for control-plane-api operations.
 * Logs to control_plane.audit_logs table.
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
import type { JwtPayload } from './auth'

/**
 * Audit actor types
 */
export type AuditActorType = 'user' | 'system' | 'api_key' | 'project' | 'mcp_token'

/**
 * Target entity types
 */
export type AuditTargetType = 'project' | 'api_key' | 'user' | 'secret' | 'feature_flag' | 'suspension' | 'quota'

/**
 * Audit log entry structure
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
  request_id?: string
  project_id?: string
}

/**
 * Log an audit entry to control_plane.audit_logs
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
 * Log secret access to audit logs
 * PRD: US-012 - Secret Access Logging
 *
 * @param userId - The user ID accessing the secret
 * @param secretId - The secret ID being accessed (never the value)
 * @param projectId - The project ID
 * @param metadata - Additional metadata (version, action, etc.)
 * @returns The created audit log ID
 */
export async function logSecretAccess(
  userId: string,
  secretId: string,
  projectId: string,
  metadata?: {
    version?: number
    action?: 'accessed' | 'created' | 'rotated' | 'listed'
    secretName?: string
  }
): Promise<string> {
  return logAuditEntry({
    actor_id: userId,
    actor_type: 'user',
    action: 'secret.accessed',
    target_type: 'secret',
    target_id: secretId,
    project_id: projectId,
    metadata: {
      // US-011: Never log secret values, only references
      secretId,
      ...metadata,
    },
  })
}

/**
 * Log secret creation to audit logs
 *
 * @param userId - The user ID creating the secret
 * @param secretId - The new secret ID
 * @param projectId - The project ID
 * @param metadata - Additional metadata (name, version)
 * @returns The created audit log ID
 */
export async function logSecretCreation(
  userId: string,
  secretId: string,
  projectId: string,
  metadata?: {
    secretName?: string
    version?: number
  }
): Promise<string> {
  return logAuditEntry({
    actor_id: userId,
    actor_type: 'user',
    action: 'secret.created',
    target_type: 'secret',
    target_id: secretId,
    project_id: projectId,
    metadata: {
      // US-011: Never log secret values, only references
      secretId,
      ...metadata,
    },
  })
}

/**
 * Log secret rotation to audit logs
 *
 * @param userId - The user ID rotating the secret
 * @param oldSecretId - The old secret ID
 * @param newSecretId - The new secret ID
 * @param projectId - The project ID
 * @param metadata - Additional metadata (name, versions, reason)
 * @returns The created audit log ID
 */
export async function logSecretRotation(
  userId: string,
  oldSecretId: string,
  newSecretId: string,
  projectId: string,
  metadata?: {
    secretName?: string
    oldVersion?: number
    newVersion?: number
    rotationReason?: string
  }
): Promise<string> {
  return logAuditEntry({
    actor_id: userId,
    actor_type: 'user',
    action: 'secret.rotated',
    target_type: 'secret',
    target_id: newSecretId,
    project_id: projectId,
    metadata: {
      // US-011: Never log secret values, only references
      oldSecretId,
      newSecretId,
      ...metadata,
    },
  })
}

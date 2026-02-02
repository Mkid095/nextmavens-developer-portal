/**
 * Storage Query Operations for Break Glass Audit Logger
 *
 * Handles all database query operations for break glass audit logging,
 * including querying sessions, actions, and audit logs.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import { getPool } from '@/lib/db';
import {
  AdminActionType,
  AdminTargetType,
  type AdminSession,
  type AdminAction,
} from './admin-database';
import type { BreakGlassAuditEntry, CombinedAuditRecord } from './types';

/**
 * Query admin session details by session ID
 *
 * @param sessionId - Break glass session ID
 * @returns Session details with admin email, or null if not found
 *
 * @example
 * ```typescript
 * const session = await getAdminSessionDetails('session-123');
 * if (session) {
 *   console.log(`Admin: ${session.email}`);
 * }
 * ```
 */
export async function getAdminSessionDetails(sessionId: string): Promise<{
  admin_id: string;
  reason: string;
  email: string;
} | null> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      s.admin_id,
      s.reason,
      d.email
    FROM control_plane.admin_sessions s
    LEFT JOIN developers d ON d.id = s.admin_id
    WHERE s.id = $1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

/**
 * Query admin action by ID
 *
 * @param adminActionId - Admin action ID
 * @returns Admin action or null if not found
 *
 * @example
 * ```typescript
 * const action = await queryAdminAction('action-123');
 * if (action) {
 *   console.log(`Action: ${action.action}`);
 * }
 * ```
 */
export async function queryAdminAction(
  adminActionId: string
): Promise<AdminAction | null> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      id,
      session_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state,
      created_at
    FROM control_plane.admin_actions
    WHERE id = $1
    `,
    [adminActionId]
  );

  return result.rows[0] || null;
}

/**
 * Query audit log by admin action ID
 *
 * @param adminActionId - Admin action ID
 * @returns Audit log entry or null if not found
 *
 * @example
 * ```typescript
 * const auditLog = await queryAuditLogByActionId('action-123');
 * if (auditLog) {
 *   console.log(`Audit log: ${auditLog.action}`);
 * }
 * ```
 */
export async function queryAuditLogByActionId(
  adminActionId: string
): Promise<BreakGlassAuditEntry | null> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      id,
      log_type,
      severity,
      project_id,
      developer_id,
      action,
      details,
      ip_address,
      user_agent,
      occurred_at
    FROM audit_logs
    WHERE (details->>'admin_action_id') = $1
    `,
    [adminActionId]
  );

  return result.rows[0] || null;
}

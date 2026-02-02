/**
 * Admin Sessions Storage Operations
 * Functions for querying admin_sessions table and complete audit trails
 */

import { getPool } from '@/lib/db';
import type { AdminSession, AdminAction } from '../admin-database';
import type { BreakGlassAuditEntry } from '../types';

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
 * Query complete audit trail for a specific break glass session
 *
 * @param sessionId - Break glass session ID
 * @returns Complete audit trail including session, actions, and audit logs
 *
 * @example
 * ```typescript
 * const trail = await querySessionAuditTrail('session-123');
 * console.log(`Admin ${trail.adminSession.admin_id} performed ${trail.actions.length} actions`);
 * ```
 */
export async function querySessionAuditTrail(
  sessionId: string
): Promise<{
  adminSession: AdminSession;
  actions: AdminAction[];
  auditLogs: BreakGlassAuditEntry[];
}> {
  const pool = getPool();

  // Get session
  const sessionResult = await pool.query(
    `
    SELECT
      id,
      admin_id,
      reason,
      access_method,
      granted_by,
      expires_at,
      created_at
    FROM control_plane.admin_sessions
    WHERE id = $1
    `,
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const adminSession = sessionResult.rows[0] as AdminSession;

  // Get all actions for this session
  const actionsResult = await pool.query(
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
    WHERE session_id = $1
    ORDER BY created_at ASC
    `,
    [sessionId]
  );

  const actions = actionsResult.rows as AdminAction[];

  // Get audit logs for this session
  const auditResult = await pool.query(
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
    WHERE (details->>'session_id') = $1
    ORDER BY occurred_at ASC
    `,
    [sessionId]
  );

  const auditLogs = auditResult.rows as BreakGlassAuditEntry[];

  return {
    adminSession,
    actions,
    auditLogs,
  };
}

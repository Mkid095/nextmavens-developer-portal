/**
 * Audit Logs Storage Operations
 * Functions for querying audit_logs table for break glass entries
 */

import { getPool } from '@/lib/db';
import type { BreakGlassAuditEntry } from '../types';
import type { AdminActionType } from '../admin-database';

/**
 * Query break glass audit logs from audit_logs table
 *
 * @param filters - Optional filters for the query
 * @returns Break glass audit log entries
 *
 * @example
 * ```typescript
 * const logs = await queryAuditLogs({
 *   projectId: 'proj-123',
 *   limit: 50,
 * });
 * ```
 */
export async function queryAuditLogs(filters: {
  adminId?: string;
  sessionId?: string;
  projectId?: string;
  action?: AdminActionType;
  limit?: number;
  offset?: number;
}): Promise<BreakGlassAuditEntry[]> {
  const { adminId, sessionId, projectId, action, limit = 50, offset = 0 } = filters;

  const pool = getPool();

  // Build query conditions - filter for break glass actions in details
  const conditions: string[] = ["(details->>'break_glass_action') IS NOT NULL"];
  const queryParams: (string | number)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`(details->>'admin_id') = $${paramIndex++}`);
    queryParams.push(adminId);
  }

  if (sessionId) {
    conditions.push(`(details->>'session_id') = $${paramIndex++}`);
    queryParams.push(sessionId);
  }

  if (projectId) {
    conditions.push(`project_id = $${paramIndex++}`);
    queryParams.push(projectId);
  }

  if (action) {
    conditions.push(`(details->>'break_glass_action') = $${paramIndex++}`);
    queryParams.push(action);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const query = `
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
    ${whereClause}
    ORDER BY occurred_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  return result.rows as BreakGlassAuditEntry[];
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

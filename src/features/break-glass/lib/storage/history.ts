/**
 * Combined History Storage Operations
 * Functions for querying combined admin_actions and admin_sessions history
 */

import { getPool } from '@/lib/db';
import type { AdminActionType, AdminTargetType } from '../admin-database';
import type { CombinedAuditRecord } from '../types';

/**
 * Query break glass audit history from admin_actions table
 *
 * @param filters - Optional filters for the query
 * @returns Combined audit records from admin_actions and admin_sessions
 *
 * @example
 * ```typescript
 * const history = await queryAdminActionsHistory({
 *   targetId: 'proj-123',
 *   targetType: AdminTargetType.PROJECT,
 *   limit: 50,
 * });
 * ```
 */
export async function queryAdminActionsHistory(filters: {
  adminId?: string;
  sessionId?: string;
  targetId?: string;
  targetType?: AdminTargetType;
  action?: AdminActionType;
  limit?: number;
  offset?: number;
}): Promise<CombinedAuditRecord[]> {
  const { adminId, sessionId, targetId, targetType, action, limit = 50, offset = 0 } = filters;

  const pool = getPool();

  // Build query conditions
  const conditions: string[] = [];
  const queryParams: (string | number)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`s.admin_id = $${paramIndex++}`);
    queryParams.push(adminId);
  }

  if (sessionId) {
    conditions.push(`aa.session_id = $${paramIndex++}`);
    queryParams.push(sessionId);
  }

  if (targetId) {
    conditions.push(`aa.target_id = $${paramIndex++}`);
    queryParams.push(targetId);
  }

  if (targetType) {
    conditions.push(`aa.target_type = $${paramIndex++}`);
    queryParams.push(targetType);
  }

  if (action) {
    conditions.push(`aa.action = $${paramIndex++}`);
    queryParams.push(action);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query admin_actions with session details
  const query = `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at,
      s.id as session_id,
      s.admin_id,
      s.reason as session_reason,
      s.access_method,
      s.granted_by,
      s.expires_at,
      s.created_at as session_created_at
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    ${whereClause}
    ORDER BY aa.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  return result.rows.map((row) => ({
    adminAction: {
      id: row.id,
      session_id: row.session_id,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      before_state: row.before_state,
      after_state: row.after_state,
      created_at: row.created_at,
    },
    adminSession: {
      id: row.session_id,
      admin_id: row.admin_id,
      reason: row.session_reason,
      access_method: row.access_method,
      granted_by: row.granted_by,
      expires_at: row.expires_at,
      created_at: row.session_created_at,
    },
  }));
}

/**
 * Admin Actions Storage Operations
 * Functions for managing admin_actions table entries
 */

import { getPool } from '@/lib/db';
import type { AdminAction, AdminActionType, AdminTargetType } from '../admin-database';

/**
 * Insert an admin action into the admin_actions table
 *
 * @param sessionId - Break glass session ID
 * @param action - Type of action performed
 * @param targetType - Type of target affected
 * @param targetId - ID of the target resource
 * @param beforeState - State before the action
 * @param afterState - State after the action
 * @returns The created admin action record
 */
export async function insertAdminAction(
  sessionId: string,
  action: AdminActionType,
  targetType: AdminTargetType,
  targetId: string,
  beforeState: Record<string, unknown>,
  afterState: Record<string, unknown>
): Promise<AdminAction> {
  const pool = getPool();

  const result = await pool.query(
    `
    INSERT INTO control_plane.admin_actions (
      session_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [sessionId, action, targetType, targetId, JSON.stringify(beforeState), JSON.stringify(afterState)]
  );

  return result.rows[0] as AdminAction;
}

/**
 * Query admin action by ID
 *
 * @param adminActionId - Admin action ID
 * @returns Admin action or null if not found
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
 * Query admin actions for coverage report
 *
 * @param filters - Optional filters for the query
 * @returns Array of admin actions with IDs and creation timestamps
 */
export async function queryAdminActionsForReport(filters: {
  adminId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Array<{
  id: string;
  session_id: string;
  action: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  created_at: Date;
}>> {
  const { adminId, sessionId, startDate, endDate } = filters;

  const pool = getPool();

  // Build query conditions
  const conditions: string[] = [];
  const queryParams: (string | Date)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`s.admin_id = $${paramIndex++}`);
    queryParams.push(adminId);
  }

  if (sessionId) {
    conditions.push(`aa.session_id = $${paramIndex++}`);
    queryParams.push(sessionId);
  }

  if (startDate) {
    conditions.push(`aa.created_at >= $${paramIndex++}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push(`aa.created_at <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get all admin actions
  const query = `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.created_at
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    ${whereClause}
    ORDER BY aa.created_at DESC
  `;

  const result = await pool.query(query, queryParams);

  return result.rows;
}

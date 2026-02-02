/**
 * Storage Insert Operations for Break Glass Audit Logger
 *
 * Handles all database insert operations for break glass audit logging.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import { getPool } from '@/lib/db';
import {
  AdminActionType,
  AdminTargetType,
  type AdminAction,
} from './admin-database';

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
 *
 * @example
 * ```typescript
 * const action = await insertAdminAction(
 *   'session-123',
 *   AdminActionType.UNLOCK_PROJECT,
 *   AdminTargetType.PROJECT,
 *   'proj-456',
 *   { status: 'SUSPENDED' },
 *   { status: 'ACTIVE' }
 * );
 * ```
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

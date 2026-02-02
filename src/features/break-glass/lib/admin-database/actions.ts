/**
 * Admin Database Module - Action Logging
 *
 * Database functions for logging admin actions.
 *
 * US-003: Implement Break Glass Authentication
 */

import { getPool } from '@/lib/db'
import type { AdminAction, LogAdminActionParams } from './types'

/**
 * Log an admin action with before/after states
 *
 * @param params - Action logging parameters
 * @returns The created action record
 *
 * @example
 * ```typescript
 * const action = await logAdminAction({
 *   session_id: 'session-123',
 *   action: AdminActionType.UNLOCK_PROJECT,
 *   target_type: AdminTargetType.PROJECT,
 *   target_id: 'proj-456',
 *   before_state: { status: 'SUSPENDED' },
 *   after_state: { status: 'ACTIVE' },
 * });
 * ```
 */
export async function logAdminAction(
  params: LogAdminActionParams
): Promise<AdminAction> {
  const { session_id, action, target_type, target_id, before_state, after_state } =
    params;

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
    [
      session_id,
      action,
      target_type,
      target_id,
      JSON.stringify(before_state),
      JSON.stringify(after_state),
    ]
  );

  return result.rows[0] as AdminAction;
}

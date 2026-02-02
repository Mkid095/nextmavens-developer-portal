/**
 * Admin Database Module - Query Functions
 *
 * Database query functions for admin sessions and actions.
 *
 * US-003: Implement Break Glass Authentication
 */

import { getPool } from '@/lib/db'
import type { AdminSession, AdminAction, AdminTargetType } from './types'

/**
 * Get an admin session by ID
 *
 * @param sessionId - Session ID
 * @returns The session or null if not found
 */
export async function getAdminSession(sessionId: string): Promise<AdminSession | null> {
  const pool = getPool();

  const result = await pool.query(
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

  return result.rows[0] || null;
}

/**
 * Get all actions for a session
 *
 * @param sessionId - Session ID
 * @returns Array of actions performed in this session
 */
export async function getSessionActions(sessionId: string): Promise<AdminAction[]> {
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
    WHERE session_id = $1
    ORDER BY created_at ASC
    `,
    [sessionId]
  );

  return result.rows as AdminAction[];
}

/**
 * Get all sessions for an admin
 *
 * @param adminId - Admin developer ID
 * @param limit - Maximum number of sessions to return
 * @returns Array of sessions
 */
export async function getAdminSessions(
  adminId: string,
  limit: number = 50
): Promise<AdminSession[]> {
  const pool = getPool();

  const result = await pool.query(
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
    WHERE admin_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [adminId, limit]
  );

  return result.rows as AdminSession[];
}

/**
 * Get action history for a specific target
 *
 * @param targetType - Target type (project, api_key, etc.)
 * @param targetId - Target ID
 * @param limit - Maximum number of actions to return
 * @returns Array of actions on this target
 */
export async function getTargetActionHistory(
  targetType: AdminTargetType,
  targetId: string,
  limit: number = 50
): Promise<AdminAction[]> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at,
      s.admin_id,
      s.reason as session_reason
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    WHERE aa.target_type = $1
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    LIMIT $3
    `,
    [targetType, targetId, limit]
  );

  return result.rows as AdminAction[];
}

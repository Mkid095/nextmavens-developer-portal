/**
 * Admin Session Database Layer
 *
 * Database functions for managing admin sessions and actions.
 * Provides CRUD operations for break glass session management.
 *
 * US-003: Implement Break Glass Authentication
 */

import { getPool } from '@/lib/db';

/**
 * Admin access methods
 */
export enum AdminAccessMethod {
  HARDWARE_KEY = 'hardware_key',
  OTP = 'otp',
  EMERGENCY_CODE = 'emergency_code',
}

/**
 * Admin action types
 */
export enum AdminActionType {
  UNLOCK_PROJECT = 'unlock_project',
  OVERRIDE_SUSPENSION = 'override_suspension',
  FORCE_DELETE = 'force_delete',
  REGENERATE_KEYS = 'regenerate_keys',
  ACCESS_PROJECT = 'access_project',
  OVERRIDE_QUOTA = 'override_quota',
  EMERGENCY_ACTION = 'emergency_action',
}

/**
 * Target types for admin actions
 */
export enum AdminTargetType {
  PROJECT = 'project',
  API_KEY = 'api_key',
  DEVELOPER = 'developer',
  SUSPENSION = 'suspension',
  QUOTA = 'quota',
  SYSTEM = 'system',
}

/**
 * Admin session record from database
 */
export interface AdminSession {
  id: string;
  admin_id: string;
  reason: string;
  access_method: AdminAccessMethod;
  granted_by: string | null;
  expires_at: Date;
  created_at: Date;
}

/**
 * Admin action record from database
 */
export interface AdminAction {
  id: string;
  session_id: string;
  action: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  created_at: Date;
}

/**
 * Parameters for creating a new admin session
 */
export interface CreateAdminSessionParams {
  admin_id: string;
  reason: string;
  access_method: AdminAccessMethod;
  granted_by?: string;
  expires_in_hours?: number;
}

/**
 * Parameters for logging an admin action
 */
export interface LogAdminActionParams {
  session_id: string;
  action: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
}

/**
 * Result of validating an admin session
 */
export interface AdminSessionValidation {
  valid: boolean;
  reason?: 'not_found' | 'expired';
  session?: AdminSession;
  expires_in_seconds?: number;
}

/**
 * Create a new admin session
 *
 * @param params - Session creation parameters
 * @returns The created session
 *
 * @example
 * ```typescript
 * const session = await createAdminSession({
 *   admin_id: 'dev-123',
 *   reason: 'Need to unlock false positive suspension',
 *   access_method: AdminAccessMethod.OTP,
 * });
 * console.log('Session token:', session.id);
 * ```
 */
export async function createAdminSession(
  params: CreateAdminSessionParams
): Promise<AdminSession> {
  const { admin_id, reason, access_method, granted_by, expires_in_hours = 1 } = params;

  const pool = getPool();

  const result = await pool.query(
    `
    INSERT INTO control_plane.admin_sessions (
      admin_id,
      reason,
      access_method,
      granted_by,
      expires_at
    )
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour' * $5)
    RETURNING *
    `,
    [admin_id, reason, access_method, granted_by || null, expires_in_hours]
  );

  return result.rows[0] as AdminSession;
}

/**
 * Validate an admin session by token (session ID)
 *
 * @param token - Session token (UUID)
 * @returns Validation result with session details if valid
 *
 * @example
 * ```typescript
 * const validation = await validateAdminSession('uuid-123');
 * if (!validation.valid) {
 *   console.error('Session invalid:', validation.reason);
 *   return;
 * }
 * console.log('Session expires in:', validation.expires_in_seconds, 'seconds');
 * ```
 */
export async function validateAdminSession(
  token: string
): Promise<AdminSessionValidation> {
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
    [token]
  );

  if (result.rows.length === 0) {
    return {
      valid: false,
      reason: 'not_found',
    };
  }

  const session = result.rows[0] as AdminSession;

  // Check if session has expired
  if (new Date(session.expires_at) < new Date()) {
    return {
      valid: false,
      reason: 'expired',
    };
  }

  // Calculate seconds until expiration
  const expiresInSeconds = Math.floor(
    (new Date(session.expires_at).getTime() - Date.now()) / 1000
  );

  return {
    valid: true,
    session,
    expires_in_seconds: expiresInSeconds,
  };
}

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

/**
 * Clean up expired sessions (maintenance function)
 *
 * @param olderThanHours - Delete sessions older than this many hours past expiration
 * @returns Number of sessions cleaned up
 */
export async function cleanupExpiredSessions(
  olderThanHours: number = 24
): Promise<number> {
  const pool = getPool();

  const result = await pool.query(
    `
    DELETE FROM control_plane.admin_sessions
    WHERE expires_at < NOW() - INTERVAL '1 hour' * $1
    `,
    [olderThanHours]
  );

  return result.rowCount || 0;
}

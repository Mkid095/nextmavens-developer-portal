/**
 * Admin Database Module - Session Management
 *
 * Database functions for managing admin sessions.
 * Provides CRUD operations for break glass session management.
 *
 * US-003: Implement Break Glass Authentication
 */

import { getPool } from '@/lib/db'
import type {
  AdminSession,
  AdminSessionValidation,
  CreateAdminSessionParams,
} from './types'

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

  // Check if session is expiring soon (within 5 minutes = 300 seconds)
  const warning = expiresInSeconds <= 300 ? ('expiring_soon' as const) : undefined;

  return {
    valid: true,
    session,
    expires_in_seconds: expiresInSeconds,
    ...(warning && { warning }),
    expires_at: session.expires_at.toISOString(),
  };
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

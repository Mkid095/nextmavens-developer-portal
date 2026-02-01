/**
 * Database Middleware
 *
 * Provides middleware functions for integrating Row Level Security
 * with Next.js API routes and JWT authentication.
 *
 * Usage:
 * ```ts
 * import { withRLSContext } from '@/lib/db/middleware'
 * import { pool } from '@/lib/db'
 *
 * export async function GET(request: Request) {
 *   return withRLSContext(pool, request, async (userId, userRole) => {
 *     // Queries here automatically use RLS
 *     const result = await pool.query('SELECT * FROM users')
 *     return Response.json(result.rows)
 *   })
 * }
 * ```
 */

import type { Pool, PoolClient } from 'pg'
import type { JWTPayload } from '@/lib/auth'
import { setUserIdContext, setUserRoleContext, setUserContext, clearUserContext } from './context'

/**
 * Extract JWT token from Authorization header
 *
 * @param authHeader - The Authorization header value
 * @returns The JWT token or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

/**
 * Execute a callback with RLS context set from JWT payload
 *
 * This helper:
 * 1. Extracts and verifies the JWT from the Authorization header
 * 2. Sets the user context (user_id and role) in the database session
 * 3. Executes the provided callback
 * 4. Clears the context after execution
 *
 * @param pool - Database connection pool
 * @param request - Next.js Request object
 * @param callback - Function to execute with RLS context
 * @returns Response from the callback
 */
export async function withRLSContext<T>(
  pool: Pool,
  request: Request,
  callback: (userId: string, userRole: string, payload: JWTPayload) => Promise<T>
): Promise<T> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw new Error('Unauthorized: No token provided')
  }

  // Import verifyJWT here to avoid circular dependency
  const { verifyJWT } = await import('@/lib/auth')
  const payload = verifyJWT(token)

  if (!payload) {
    throw new Error('Unauthorized: Invalid token')
  }

  const userId = payload.sub
  const userRole = payload.role || 'user'

  if (!userId) {
    throw new Error('Unauthorized: No user ID in token')
  }

  // Set user context for RLS
  await setUserContext(pool, userId, userRole)

  try {
    // Execute callback with RLS context active
    return await callback(userId, userRole, payload)
  } finally {
    // Always clear context after execution
    await clearUserContext(pool)
  }
}

/**
 * Execute a callback with admin RLS bypass
 *
 * Use this for service operations that need to access all data.
 * This sets the user_role to 'admin' which allows RLS policies to bypass restrictions.
 *
 * @param pool - Database connection pool
 * @param callback - Function to execute with admin privileges
 * @returns Result from the callback
 */
export async function withAdminContext<T>(
  pool: Pool,
  callback: () => Promise<T>
): Promise<T> {
  await setUserRoleContext(pool, 'admin')

  try {
    return await callback()
  } finally {
    await clearUserContext(pool)
  }
}

/**
 * Execute a callback with service role RLS context
 *
 * Service roles have elevated privileges for creating users,
 * inserting audit logs, and managing migrations.
 *
 * @param pool - Database connection pool
 * @param callback - Function to execute with service role
 * @returns Result from the callback
 */
export async function withServiceContext<T>(
  pool: Pool,
  callback: () => Promise<T>
): Promise<T> {
  await setUserRoleContext(pool, 'service')

  try {
    return await callback()
  } finally {
    await clearUserContext(pool)
  }
}

/**
 * Create a database client with user context pre-configured
 *
 * This is useful when you need to make multiple queries with
 * the same RLS context.
 *
 * @param pool - Database connection pool
 * @param userId - User UUID to set as current user
 * @param userRole - User role (default: 'user')
 * @returns A database client with RLS context set
 */
export async function createRLSClient(
  pool: Pool,
  userId: string,
  userRole: string = 'user'
): Promise<PoolClient> {
  const client = await pool.connect()
  await client.query(`SET LOCAL app.user_id = '${userId}'`)
  await client.query(`SET LOCAL app.user_role = '${userRole}'`)
  return client
}

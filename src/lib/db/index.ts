/**
 * Database Module
 *
 * Exports database context management functions for Row Level Security.
 *
 * Usage:
 * ```ts
 * import { setUserIdContext, setUserContext, withAdminBypass, withRLSContext } from '@/lib/db'
 *
 * // Set user context for RLS
 * await setUserIdContext(pool, userId)
 * await setUserContext(pool, userId, userRole)
 *
 * // Execute with admin privileges
 * const result = await withAdminBypass(pool, async (client) => {
 *   const res = await client.query('SELECT * FROM users')
 *   return res.rows
 * })
 *
 * // In API routes with JWT
 * export async function GET(request: Request) {
 *   return withRLSContext(pool, request, async (userId, userRole) => {
 *     const result = await pool.query('SELECT * FROM users')
 *     return Response.json(result.rows)
 *   })
 * }
 * ```
 */

export {
  setUserIdContext,
  setUserRoleContext,
  setUserContext,
  clearUserContext,
  withAdminBypass,
  getCurrentUserId,
  getCurrentUserRole,
} from './context'

export {
  extractTokenFromHeader,
  withRLSContext,
  withAdminContext,
  withServiceContext,
  createRLSClient,
} from './middleware'

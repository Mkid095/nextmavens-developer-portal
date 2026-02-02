/**
 * Authentication and Authorization Middleware - Authentication Functions
 *
 * US-004: Create Permission Middleware
 * US-007: Enforce Status Checks at Gateway
 */

import type { NextRequest } from 'next/server'
import { verifyAccessToken, checkProjectStatus, type JwtPayload } from '@/lib/auth'
import type { User } from '@/lib/rbac'
import type { AuthenticatedRequest } from './types'

/**
 * Authenticate a request and extract user information from JWT token.
 * US-007: Also checks project status to enforce gateway-level status checks.
 *
 * @param req - The Next.js request object
 * @param projectId - Optional project ID to check status for
 * @returns Promise resolving to authenticated user info
 * @throws Error if no token provided or token is invalid
 * @throws PlatformError if project is suspended/archived/deleted (US-007)
 *
 * @example
 * ```ts
 * try {
 *   const { user } = await authenticateRequest(req)
 *   // User is authenticated and project is ACTIVE, proceed with request
 * } catch (error) {
 *   // Return 401 Unauthorized or 403 Forbidden (for suspended projects)
 * }
 * ```
 */
export async function authenticateRequest(
  req: NextRequest,
  projectId?: string
): Promise<AuthenticatedRequest> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)

  // US-007: Enforce Status Checks at Gateway
  // Check project status to ensure suspended/archived/deleted projects can't make requests
  const targetProjectId = projectId || payload.project_id
  if (targetProjectId) {
    await checkProjectStatus(targetProjectId)
  }

  return {
    user: { id: payload.id },
    id: payload.id,
    email: payload.email
  }
}

/**
 * Create a middleware that requires authentication.
 * US-007: Also enforces project status checks at the gateway level.
 *
 * Wraps an API route handler to ensure the request is authenticated.
 * Returns 401 Unauthorized if authentication fails.
 * Returns 403 Forbidden if project is suspended/archived/deleted (US-007).
 *
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler that enforces authentication and project status
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (req, user) => {
 *   // User is authenticated and project is ACTIVE
 *   return NextResponse.json({ data: 'protected' })
 * })
 * ```
 */
export function withAuth(
  handler: (
    req: NextRequest,
    user: User,
    context?: { params: Record<string, string> | Promise<Record<string, string>> }
  ) => Promise<Response>
): (
  req: NextRequest,
  context?: { params: Record<string, string> | Promise<Record<string, string>> }
) => Promise<Response> {
  return async (
    req: NextRequest,
    context?: { params: Record<string, string> | Promise<Record<string, string>> }
  ) => {
    try {
      const { user } = await authenticateRequest(req)
      return handler(req, user, context)
    } catch (error) {
      // US-007: Handle PlatformError for project status checks
      // Returns 403 for suspended/archived/deleted projects
      const { toErrorNextResponse } = require('@/lib/errors')
      return toErrorNextResponse(error)
    }
  }
}

/**
 * Authentication and Authorization Middleware
 *
 * Provides middleware functions for Next.js API routes to handle
 * authentication and permission checking.
 *
 * US-008: Apply Permissions to User Management
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload } from './auth'
import { checkUserPermission, User } from './rbac'
import { Permission } from './types/rbac.types'

/**
 * Result of authenticated request.
 */
export interface AuthenticatedRequest {
  user: User
}

/**
 * Permission middleware configuration options.
 */
export interface PermissionMiddlewareOptions {
  /**
   * The permission required to access the route.
   */
  permission: Permission

  /**
   * Function to extract the organization ID from the request.
   * Can read from path params, query params, or request body.
   */
  getOrganizationId: (req: NextRequest) => string | Promise<string>
}

/**
 * Type for a Next.js API route handler.
 */
type ApiHandler = (
  req: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>

/**
 * Authenticate a request and extract user information from JWT token.
 *
 * @param req - The Next.js request object
 * @returns Promise resolving to authenticated user info
 * @throws Error if no token provided or token is invalid
 */
export async function authenticateRequestAndGetUser(
  req: NextRequest
): Promise<AuthenticatedRequest> {
  const payload = await authenticateRequest(req)
  return {
    user: { id: payload.id }
  }
}

/**
 * Create a middleware that requires a specific permission.
 *
 * Wraps an API route handler to ensure the request is authenticated
 * AND the user has the required permission within an organization.
 * Returns 401 if not authenticated, 403 if not permitted.
 *
 * @param options - Permission middleware options
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler that enforces authentication and authorization
 */
export function requirePermission(
  options: PermissionMiddlewareOptions,
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    // First, authenticate the request
    let user: User
    try {
      const authResult = await authenticateRequestAndGetUser(req)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error instanceof Error ? error.message : 'Authentication failed'
          }
        },
        { status: 401 }
      )
    }

    // Then, check the permission
    try {
      const organizationId = await options.getOrganizationId(req)
      const result = await checkUserPermission(user, organizationId, options.permission)

      if (!result.granted) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: result.reason || 'You do not have permission to perform this action',
              required_permission: options.permission
            }
          },
          { status: 403 }
        )
      }

      // User is authenticated and has permission, proceed with handler
      return handler(req, user)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Permission check failed'
          }
        },
        { status: 500 }
      )
    }
  }
}

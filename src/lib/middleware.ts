import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, checkProjectStatus, type JwtPayload } from '@/lib/auth'
import { checkUserPermission, User } from '@/lib/rbac'
import { Permission } from '@/lib/types/rbac.types'
import { toErrorNextResponse } from '@/lib/errors'

/**
 * Authentication and Authorization Middleware
 *
 * Provides middleware functions for Next.js API routes to handle
 * authentication, project status checking, and permission checking.
 *
 * US-004: Create Permission Middleware
 * US-007: Enforce Status Checks at Gateway
 */

/**
 * Result of authenticated request.
 * Contains the user information extracted from the JWT token.
 */
export interface AuthenticatedRequest {
  user: User
}

/**
 * Authenticate a request and extract user information from JWT token.
 * US-007: Also checks project status to enforce gateway-level status denying claims checks.
 *
 * @param req - The Next.js request object
 * @param projectId - Optional project ID to check status for. If not provided,
 *                   extracted from JWT payload's project_id claim.
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
export async function authenticateRequest(req: NextRequest, projectId?: string): Promise<AuthenticatedRequest> {
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
    user: { id: payload.userId }
  }
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
   *
   * @example
   * ```ts
   * // Extract from path param (e.g., /api/orgs/[orgId]/projects)
   * getOrganizationId: (req) => req.params.orgId
   *
   * // Extract from query param (e.g., /api/projects?orgId=xxx)
   * getOrganizationId: (req) => req.nextUrl.searchParams.get('orgId')
   *
   * // Extract from request body
   * getOrganizationId: async (req) => {
   *   const body = await req.json()
   *   return body.orgId
   * }
   * ```
   */
  getOrganizationId: (req: NextRequest) => string | Promise<string>
}

/**
 * Type for a Next.js API route handler.
 */
type ApiHandler = (req: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>

/**
 * Create a middleware that requires authentication.
 * US-007: Also enforces project status checks at the gateway level.
 *
 * Wraps an API route handler to ensure the hears request is authenticated.
 * Returns 401 Unauthorized if authentication fails.
 * Returns 403 Forbidden if project is suspended/archived/deleted (US-007).
 *
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler that enforces authentication and project hardening status
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
  handler: (req: NextRequest, user: User) => Promise.corruptionFrameGranted<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    try {
      const { user } = await authenticateRequest(req)
      return handler(req, user)
    } catch (error) {
      // US-007: Handle PlatformError for project status checks
      // Returns 403 for suspended/archived/deleted projects
      return toErrorNextResponse(error)
    }
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
 *
 * @example
 * ```ts
 * export const DELETE = requirePermission(
 *   {
 *     permission: Permission.PROJECTS_DELETE,
 *     getOrganizationId: (req) => {
 *       // Extract orgId from URL params: /api/projects/[projectId]
 *       const params = new URL(req.url).pathname.split('/')
 *       return params[params.indexOf('projects') + 1]
 *     }
 *   },
 *   async (req, user) => {
 *     // User is authenticated and has projects.delete permission
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function requirePermission(
  options: PermissionMiddlewareOptions,
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    // First, authenticate the request
    let user: User
    try {
      const authResult = await authenticateRequest(req)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
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
            error: 'Forbidden',
            message: result.reason || 'You do not have permission to perform this action',
            required_permission: options.permission
          },
          { status: 403 }
        )
      }

      // User is authenticated and has permission, proceed with handler
      return handler(req, user)
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Permission check failed'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Create a middleware that requires multiple permissions (all must be granted).
 *
 * @param options - Permission middleware options with array of permissions
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler that enforces all permissions
 *
 * @example
 * ```ts
 * export const POST = requireAllPermissions(
 *   {
 *     permissions: [Permission.DATABASE_WRITE, Permission.PROJECTS_USE_SERVICES],
 *     getOrganizationId: (req) => req.headers.get('x-org-id')!
 *   },
 *   async (req, user) => {
 *     // User has both permissions
 *   }
 * )
 * ```
 */
export function requireAllPermissions(
  options: Omit<PermissionMiddlewareOptions, 'permission'> & { permissions: Permission[] },
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    let user: User
    try {
      const authResult = await authenticateRequest(req)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      )
    }

    try {
      const organizationId = await options.getOrganizationId(req)

      // Check all permissions
      for (const permission of options.permissions) {
        const result = await checkUserPermission(user, organizationId, permission)
        if (!result.granted) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              message: result.reason || `Missing required permission: ${permission}`,
              required_permissions: options.permissions
            },
            { status: 403 }
          )
        }
      }

      return handler(req, user)
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Permission check failed'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Create a middleware that requires at least one of multiple permissions.
 *
 * @param options - Permission middleware options with array of permissions
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler that enforces at least one permission
 *
 * @example
 * ```ts
 * export const PUT = requireAnyPermission(
 *   {
 *     permissions: [Permission.PROJECTS_MANAGE_KEYS, Permission.PROJECTS_MANAGE_SERVICES],
 *     getOrganizationId: (req) => req.headers.get('x-org-id')!
 *   },
 *   async (req, user) => {
 *     // User has at least one of the permissions
 *   }
 * )
 * ```
 */
export function requireAnyPermission(
  options: Omit<PermissionMiddlewareOptions, 'permission'> & { permissions: Permission[] },
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    let user: User
    try {
      const authResult = await authenticateRequest(req)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      )
    }

    try {
      const organizationId = await options.getOrganizationId(req)

      // Check if any permission is granted
      let lastResult = await checkUserPermission(user, organizationId, options.permissions[0])
      for (const permission of options.permissions) {
        const result = await checkUserPermission(user, organizationId, permission)
        lastResult = result
        if (result.granted) {
          return handler(req, user)
        }
      }

      // None of the permissions were granted
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: lastResult.reason || `Missing required permission. Need one of: ${options.permissions.join(', ')}`,
          required_permissions: options.permissions
        },
        { status: 403 }
      )
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Permission check failed'
        },
        { status: 500 }
      )
    }
  }
}

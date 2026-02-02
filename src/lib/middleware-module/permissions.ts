/**
 * Authentication and Authorization Middleware - Permission Functions
 *
 * US-004: Create Permission Middleware
 */

import { NextResponse } from 'next/server'
import { checkUserPermission, type User } from '@/lib/rbac'
import type { Permission } from '@/lib/types/rbac.types'
import type { PermissionMiddlewareOptions, MultiplePermissionMiddlewareOptions, ApiHandler } from './types'
import { authenticateRequest } from './authenticate'

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
  handler: (req: Request, user: User, context?: { params: Record<string, string> | Promise<Record<string, string>> }) => Promise<Response>
): ApiHandler {
  return async (req: Request, context?: { params: Record<string, string> | Promise<Record<string, string>> }) => {
    // First, authenticate the request
    let user: User
    try {
      const authResult = await authenticateRequest(req as any)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      )
    }

    // Then, check the permission
    try {
      const organizationId = await options.getOrganizationId(req as any)
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
      return handler(req as any, user, context)
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
  handler: (req: Request, user: User, context?: { params: Record<string, string> | Promise<Record<string, string>> }) => Promise<Response>
): ApiHandler {
  return async (req: Request, context?: { params: Record<string, string> | Promise<Record<string, string>> }) => {
    let user: User
    try {
      const authResult = await authenticateRequest(req as any)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      )
    }

    try {
      const organizationId = await options.getOrganizationId(req as any)

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

      return handler(req as any, user, context)
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
  handler: (req: Request, user: User, context?: { params: Record<string, string> | Promise<Record<string, string>> }) => Promise<Response>
): ApiHandler {
  return async (req: Request, context?: { params: Record<string, string> | Promise<Record<string, string>> }) => {
    let user: User
    try {
      const authResult = await authenticateRequest(req as any)
      user = authResult.user
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      )
    }

    try {
      const organizationId = await options.getOrganizationId(req as any)

      // Check if any permission is granted
      let lastResult = await checkUserPermission(user, organizationId, options.permissions[0])
      for (const permission of options.permissions) {
        const result = await checkUserPermission(user, organizationId, permission)
        lastResult = result
        if (result.granted) {
          return handler(req as any, user, context)
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

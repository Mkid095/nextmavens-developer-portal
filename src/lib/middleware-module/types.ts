/**
 * Authentication and Authorization Middleware - Type Definitions
 *
 * US-004: Create Permission Middleware
 * US-007: Enforce Status Checks at Gateway
 */

import type { User } from '@/lib/rbac'
import type { AuthenticatedEntity } from '@/lib/auth'
import type { Permission } from '@/lib/types/rbac.types'

/**
 * Result of authenticated request.
 * Contains the user information extracted from the JWT token.
 */
export interface AuthenticatedRequest extends AuthenticatedEntity {
  user: User
  id: string // Alias for user.id for backward compatibility
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
  getOrganizationId: (req: Request) => string | Promise<string>
}

/**
 * Type for a Next.js API route handler with context support.
 */
export type ApiHandler = (
  req: Request,
  context?: { params: Record<string, string> | Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Multiple permission middleware options.
 */
export interface MultiplePermissionMiddlewareOptions {
  permissions: Permission[]
  getOrganizationId: (req: Request) => string | Promise<string>
}

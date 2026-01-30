/**
 * US-002: Scope Database Queries
 * US-005: Update API Gateway Errors (Standardized Error Format)
 *
 * Middleware for enforcing tenant isolation at the API gateway level.
 * Validates project ownership and prevents cross-project access.
 * Uses standardized error format for consistent error responses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { type JwtPayload } from './auth'
import { getTenantContext, TenantAccessError } from './tenant-db'
import {
  ErrorCode,
  toErrorNextResponse,
  createError,
  authenticationError,
  permissionDeniedError,
  notFoundError,
  validationError,
  internalError,
} from '@/lib/errors'

/**
 * Standard error response for API gateway using standardized error format
 * Maps error codes to appropriate HTTP responses
 */
export function gatewayErrorResponse(
  code: ErrorCode,
  message: string,
  projectId?: string,
  details?: Record<string, unknown>
): Response {
  const error = createError(code, message, projectId, details)
  return error.toNextResponse()
}

/**
 * Validate that the request is for the correct project
 * Compares JWT project_id with requested project_id
 *
 * US-002: Returns 403 for cross-project access attempts
 */
export function validateProjectAccess(
  jwtProjectId: string,
  requestedProjectId: string
): { valid: boolean; error?: string } {
  if (jwtProjectId !== requestedProjectId) {
    return {
      valid: false,
      error: 'Access to other project\'s resources not permitted',
    }
  }

  return { valid: true }
}

/**
 * Validate project ownership and existence
 * Ensures the developer owns the project they're trying to access
 */
export async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any; error?: string }> {
  const { getPool } = await import('./db')
  const pool = getPool()

  const result = await pool.query(
    `SELECT
      p.id, p.developer_id, p.project_name, p.tenant_id,
      p.webhook_url, p.allowed_origins, p.rate_limit,
      p.status, p.environment, p.created_at,
      t.slug as tenant_slug
    FROM control_plane.projects p
    JOIN control_plane.tenants t ON p.tenant_id = t.id
    WHERE p.id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false, error: 'NOT_FOUND' }
  }

  const project = result.rows[0]
  if (project.developer_id !== developer.id) {
    return { valid: false, error: 'FORBIDDEN' }
  }

  return { valid: true, project }
}

/**
 * Gateway context for tenant-scoped requests
 */
export interface GatewayContext {
  projectId: string
  developerId: string
  tenantSlug: string
  tenantId: string
}

/**
 * Create gateway context from JWT and project ID
 * Validates access and returns tenant information
 */
export async function createGatewayContext(
  projectId: string,
  jwt: JwtPayload
): Promise<{ success: boolean; context?: GatewayContext; error?: string }> {
  // Validate project access (prevent cross-project access)
  const accessCheck = validateProjectAccess(jwt.project_id, projectId)
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.error!,
    }
  }

  // Get tenant context
  const tenantContext = await getTenantContext(projectId)
  if (!tenantContext) {
    return {
      success: false,
      error: 'Project not found',
    }
  }

  // Validate ownership
  const ownershipCheck = await validateProjectOwnership(projectId, jwt)
  if (!ownershipCheck.valid) {
    return {
      success: false,
      error: ownershipCheck.error === 'NOT_FOUND' ? 'Project not found' : 'Access denied',
    }
  }

  return {
    success: true,
    context: {
      projectId: tenantContext.projectId,
      developerId: jwt.id,
      tenantSlug: tenantContext.slug,
      tenantId: tenantContext.tenantId,
    },
  }
}

/**
 * Middleware factory for tenant-scoped API routes
 * Wraps route handlers with tenant isolation enforcement
 */
export function withTenantIsolation<
  TParams extends { id?: string } | Record<string, never> = Record<string, never>
>(
  handler: (
    req: NextRequest,
    params: TParams,
    context: GatewayContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, params: TParams): Promise<NextResponse> => {
    try {
      const { authenticateRequest } = await import('./auth')
      type JwtPayload = import('./auth').JwtPayload

      // Authenticate request
      const jwt = await authenticateRequest(req) as JwtPayload

      // Extract project ID from params or body
      let projectId: string | undefined

      if ('id' in params && params.id) {
        projectId = params.id as string
      } else {
        // Try to get from query params
        const url = new URL(req.url)
        projectId = url.searchParams.get('project_id') || undefined
      }

      if (!projectId) {
        return validationError('Project ID is required').toNextResponse()
      }

      // Create gateway context (validates access and ownership)
      const contextResult = await createGatewayContext(projectId, jwt)

      if (!contextResult.success || !contextResult.context) {
        const error = contextResult.error === 'Project not found'
          ? notFoundError('Project not found', jwt.project_id)
          : permissionDeniedError(contextResult.error || 'Access denied', jwt.project_id)
        return error.toNextResponse()
      }

      // Call the actual handler with gateway context
      return await handler(req, params, contextResult.context)
    } catch (error) {
      // Handle authentication errors using standardized error format
      if (error instanceof Error) {
        if (error.message === 'No token provided') {
          return authenticationError('Authentication required').toNextResponse()
        }
        if (error.message === 'Invalid token') {
          return authenticationError('Invalid or expired token').toNextResponse()
        }
        if (error.message === 'Missing project_id claim') {
          return authenticationError('Token must include project_id claim').toNextResponse()
        }
      }

      console.error('Error in tenant isolation middleware:', error)
      return internalError('Internal server error').toNextResponse()
    }
  }
}

/**
 * Check if a request is for a system/admin endpoint
 * System endpoints bypass tenant isolation
 */
export function isSystemEndpoint(pathname: string): boolean {
  const systemPaths = ['/api/internal', '/api/admin', '/api/health', '/api/v1/projects']
  return systemPaths.some(path => pathname.startsWith(path))
}

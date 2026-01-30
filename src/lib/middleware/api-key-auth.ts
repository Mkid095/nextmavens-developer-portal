/**
 * API Key Authentication and Scope Enforcement Middleware
 *
 * Provides middleware for API gateway to authenticate API keys
 * and enforce scope-based access control.
 *
 * US-007: Implement MCP Scope Enforcement
 * - Gateway checks key type and scopes
 * - MCP tokens limited to their scopes
 * - Read-only tokens rejected for write operations
 * - Returns PERMISSION_DENIED with clear message
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, type ApiKeyAuth } from '@/lib/auth'
import {
  gatewayMcpScopeEnforcement,
  type McpScopeErrorResponse,
} from '@/lib/mcp-scope-enforcement'
import type { ApiKey, ApiKeyScope } from '@/lib/types/api-key.types'
import { ErrorCode, createError } from '@/lib/errors'

/**
 * Map ApiKeyAuth to ApiKey interface for scope enforcement
 */
function authToApiKey(auth: ApiKeyAuth): ApiKey {
  return {
    id: auth.id,
    name: auth.name,
    key_type: auth.key_type as any,
    key_prefix: auth.key_prefix,
    scopes: auth.scopes as ApiKeyScope[],
    environment: auth.environment as any,
    created_at: auth.created_at,
    last_used: undefined,
    expires_at: undefined,
    rotated_to: undefined,
    usage_count: undefined,
  }
}

/**
 * Result of successful API key authentication
 */
export interface AuthenticatedApiKey {
  apiKey: ApiKey
  projectId: string
  developerId: string
}

/**
 * Extract API key from request
 *
 * Checks multiple sources for the API key:
 * 1. x-api-key header (primary method)
 * 2. Authorization header with Bearer token
 *
 * @param req - The Next.js request
 * @returns The API key string or null
 */
export function extractApiKey(req: NextRequest): string | null {
  // Check x-api-key header first
  const apiKey = req.headers.get('x-api-key')
  if (apiKey) {
    return apiKey
  }

  // Check Authorization header with Bearer token
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * Authenticate API key and return key details with scope enforcement
 *
 * @param req - The Next.js request
 * @returns Authenticated API key details
 * @throws PlatformError if authentication fails
 */
export async function authenticateApiKeyWithScope(
  req: NextRequest
): Promise<AuthenticatedApiKey> {
  const apiKey = extractApiKey(req)

  if (!apiKey) {
    throw createError(
      ErrorCode.KEY_INVALID,
      'API key is required. Provide it via x-api-key header or Authorization header.'
    )
  }

  const auth = await authenticateApiKey(apiKey)

  return {
    apiKey: authToApiKey(auth),
    projectId: auth.project_id,
    developerId: auth.developer_id,
  }
}

/**
 * Enforce scope requirements for an authenticated API key
 *
 * @param authenticated - The authenticated API key details
 * @param operation - The operation being performed (e.g., 'db:select')
 * @throws McpScopeErrorResponse if scope check fails
 */
export function enforceScopeForApiKey(
  authenticated: AuthenticatedApiKey,
  operation: string
): void {
  const result = gatewayMcpScopeEnforcement(authenticated.apiKey, operation)

  if (result) {
    // Throw the error so it can be caught by the middleware
    throw result.error
  }
}

/**
 * Create a standardized error response for scope enforcement failures
 *
 * @param error - The scope enforcement error
 * @returns NextResponse with appropriate status code and error details
 */
export function createScopeErrorResponse(error: McpScopeErrorResponse): NextResponse {
  return NextResponse.json(
    {
      error: error.error,
      code: error.code,
      message: error.message,
      required_scope: error.required_scope,
      service: error.service,
      key_type: error.key_type,
      key_prefix: error.key_prefix,
      mcp_access_level: error.mcp_access_level,
      operation_type: error.operation_type,
    },
    { status: 403 }
  )
}

/**
 * Middleware factory for API key authentication with scope enforcement
 *
 * This middleware:
 * 1. Authenticates the API key
 * 2. Checks the required scope for the operation
 * 3. Returns appropriate error if authentication or scope check fails
 *
 * @param options - Middleware options
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with API key authentication and scope enforcement
 *
 * @example
 * ```typescript
 * import { withApiKeyScope } from '@/lib/middleware/api-key-auth'
 * import { NextRequest, NextResponse } from 'next/server'
 *
 * const handler = async (
 *   req: NextRequest,
 *   auth: AuthenticatedApiKey
 * ) => {
 *   // API key is authenticated and scope is validated
 *   return NextResponse.json({ success: true })
 * }
 *
 * export const POST = withApiKeyScope(
 *   { operation: 'db:insert' },
 *   handler
 * )
 * ```
 */
export function withApiKeyScope<
  TParams extends { projectId?: string } | Record<string, never> = Record<string, never>
>(
  options: {
    /**
     * The operation being performed (e.g., 'db:select', 'storage:write')
     */
    operation: string
    /**
     * Optional function to extract the operation from the request
     * If provided, this overrides the static operation option
     */
    getOperation?: (req: NextRequest, params: TParams) => string | Promise<string>
  },
  handler: (
    req: NextRequest,
    params: TParams,
    auth: AuthenticatedApiKey
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, params: TParams): Promise<NextResponse> => {
    try {
      // Authenticate API key
      const authenticated = await authenticateApiKeyWithScope(req)

      // Determine the operation
      const operation = options.getOperation
        ? await options.getOperation(req, params)
        : options.operation

      // Enforce scope requirements
      enforceScopeForApiKey(authenticated, operation)

      // Call the actual handler with authenticated context
      return await handler(req, params, authenticated)
    } catch (error: any) {
      // Handle scope enforcement errors
      if (error.error === 'PERMISSION_DENIED') {
        return createScopeErrorResponse(error as McpScopeErrorResponse)
      }

      // Handle other errors (authentication failures, etc.)
      if (error.code) {
        return NextResponse.json(
          {
            error: error.error || 'Internal Server Error',
            code: error.code,
            message: error.message || 'An error occurred',
          },
          { status: error.statusCode || 500 }
        )
      }

      // Generic error response
      console.error('Error in API key scope middleware:', error)
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware factory for API key authentication without scope check
 *
 * Use this when you just need authentication but will check scopes later
 *
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with API key authentication
 *
 * @example
 * ```typescript
 * import { withApiKeyAuth } from '@/lib/middleware/api-key-auth'
 * import { NextResponse } from 'next/server'
 *
 * const handler = async (req: NextRequest, auth: AuthenticatedApiKey) => {
 *   // API key is authenticated
 *   // Check scopes manually as needed
 *   return NextResponse.json({ success: true })
 * }
 *
 * export const GET = withApiKeyAuth(handler)
 * ```
 */
export function withApiKeyAuth<
  TParams extends { projectId?: string } | Record<string, never> = Record<string, never>
>(
  handler: (
    req: NextRequest,
    params: TParams,
    auth: AuthenticatedApiKey
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, params: TParams): Promise<NextResponse> => {
    try {
      const authenticated = await authenticateApiKeyWithScope(req)
      return await handler(req, params, authenticated)
    } catch (error: any) {
      if (error.code) {
        return NextResponse.json(
          {
            error: error.error || 'Internal Server Error',
            code: error.code,
            message: error.message || 'An error occurred',
          },
          { status: error.statusCode || 500 }
        )
      }

      console.error('Error in API key auth middleware:', error)
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      )
    }
  }
}

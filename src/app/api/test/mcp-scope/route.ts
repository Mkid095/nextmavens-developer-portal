/**
 * MCP Scope Enforcement Test API
 *
 * US-007: Implement MCP Scope Enforcement
 *
 * This endpoint is used to test and demonstrate MCP scope enforcement.
 * It accepts an API key (x-api-key header) and an operation, then validates
 * whether the key has permission to perform that operation.
 *
 * Test scenarios:
 * 1. MCP read-only token attempting write operations (should be denied)
 * 2. MCP write token attempting write operations (should be allowed)
 * 3. MCP admin token attempting any operations (should be allowed)
 * 4. Non-MCP tokens (should use regular scope enforcement)
 *
 * POST /api/test/mcp-scope
 * Headers: x-api-key: <api_key>
 * Body: { operation: string }
 *
 * Success response (200):
 * {
 *   "allowed": true,
 *   "operation": "db:select",
 *   "key_type": "mcp",
 *   "key_prefix": "mcp_ro_",
 *   "scopes": ["db:select", "storage:read", "realtime:subscribe"]
 * }
 *
 * Error response (403):
 * {
 *   "error": "PERMISSION_DENIED",
 *   "code": "MCP_WRITE_DENIED",
 *   "message": "MCP read-only token cannot perform write operations...",
 *   "required_scope": "db:insert",
 *   "service": "db"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, type ApiKeyAuth } from '@/lib/auth'
import {
  enforceScopeWithMcpRestrictions,
  isMcpToken,
  isMcpReadOnlyToken,
  type ScopeErrorResponse,
} from '@/lib/scope-enforcement'
import { createError, ErrorCode, type PlatformError } from '@/lib/errors'

/**
 * Map operation strings to their readable descriptions
 */
const OPERATION_DESCRIPTIONS: Record<string, string> = {
  'db:select': 'Read database rows',
  'db:insert': 'Insert database rows',
  'db:update': 'Update database rows',
  'db:delete': 'Delete database rows',
  'storage:read': 'Read storage files',
  'storage:write': 'Write storage files',
  'auth:signin': 'Sign in users',
  'auth:signup': 'Sign up users',
  'auth:manage': 'Manage user accounts',
  'realtime:subscribe': 'Subscribe to realtime channels',
  'realtime:publish': 'Publish to realtime channels',
  'graphql:execute': 'Execute GraphQL queries',
}

/**
 * POST /api/test/mcp-scope
 *
 * Test MCP scope enforcement for a given operation
 */
export async function POST(req: NextRequest) {
  try {
    // Extract API key from header
    const apiKeyHeader = req.headers.get('x-api-key')
    if (!apiKeyHeader) {
      const error = createError(
        ErrorCode.AUTHENTICATION_ERROR,
        'API key is required. Provide it via x-api-key header.'
      )
      return NextResponse.json(error.toJson(), { status: 401 })
    }

    // Authenticate the API key
    const apiKeyAuth: ApiKeyAuth = await authenticateApiKey(apiKeyHeader)

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const { operation } = body

    if (!operation) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Operation is required. Provide one of: ' + Object.keys(OPERATION_DESCRIPTIONS).join(', '),
        },
        { status: 400 }
      )
    }

    // Build ApiKey object from auth result
    const apiKey = {
      id: apiKeyAuth.id,
      name: apiKeyAuth.name,
      key_type: apiKeyAuth.key_type as any,
      key_prefix: apiKeyAuth.key_prefix,
      scopes: apiKeyAuth.scopes as any[],
      environment: apiKeyAuth.environment as any,
      created_at: apiKeyAuth.created_at,
    }

    // Test scope enforcement with MCP restrictions
    try {
      enforceScopeWithMcpRestrictions(apiKey, operation)

      // Operation is allowed
      return NextResponse.json({
        allowed: true,
        operation,
        description: OPERATION_DESCRIPTIONS[operation] || operation,
        key_type: apiKeyAuth.key_type,
        key_prefix: apiKeyAuth.key_prefix,
        scopes: apiKeyAuth.scopes,
        is_mcp_token: isMcpToken(apiKey),
        is_mcp_read_only: isMcpReadOnlyToken(apiKey),
        message: `Operation '${operation}' is allowed for this ${apiKeyAuth.key_type} token`,
      })
    } catch (scopeError) {
      const error = scopeError as ScopeErrorResponse

      // Operation is denied
      return NextResponse.json(
        {
          error: error.error,
          code: error.code,
          message: error.message,
          required_scope: error.required_scope,
          service: error.service,
          operation,
          description: OPERATION_DESCRIPTIONS[operation] || operation,
          key_type: apiKeyAuth.key_type,
          key_prefix: apiKeyAuth.key_prefix,
          scopes: apiKeyAuth.scopes,
          is_mcp_token: isMcpToken(apiKey),
          is_mcp_read_only: isMcpReadOnlyToken(apiKey),
        },
        { status: 403 }
      )
    }
  } catch (error: any) {
    console.error('[MCP Scope Test] Error:', error)

    // Handle PlatformError
    if (error.code) {
      const platformError = error as PlatformError
      return NextResponse.json(platformError.toJson(), { status: platformError.httpCode || 500 })
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/test/mcp-scope
 *
 * Returns information about available test operations
 */
export async function GET() {
  return NextResponse.json({
    message: 'MCP Scope Enforcement Test Endpoint',
    usage: {
      method: 'POST',
      url: '/api/test/mcp-scope',
      headers: {
        'x-api-key': 'Your API key (MCP tokens: mcp_ro_*, mcp_rw_*, mcp_admin_*)',
      },
      body: {
        operation: 'The operation to test (e.g., db:select, db:insert, storage:write)',
      },
    },
    available_operations: OPERATION_DESCRIPTIONS,
    test_scenarios: [
      {
        scenario: 'MCP read-only token attempting write operation',
        operation: 'db:insert',
        expected_result: 'DENIED with MCP_WRITE_DENIED error',
        reason: 'Read-only tokens only have db:select, storage:read, realtime:subscribe scopes',
      },
      {
        scenario: 'MCP read-only token attempting read operation',
        operation: 'db:select',
        expected_result: 'ALLOWED',
        reason: 'Read-only tokens have db:select scope',
      },
      {
        scenario: 'MCP write token attempting write operation',
        operation: 'db:insert',
        expected_result: 'ALLOWED',
        reason: 'Write tokens have db:insert scope',
      },
      {
        scenario: 'MCP admin token attempting delete operation',
        operation: 'db:delete',
        expected_result: 'ALLOWED',
        reason: 'Admin tokens have all scopes including db:delete',
      },
      {
        scenario: 'MCP read-only token attempting auth operation',
        operation: 'auth:manage',
        expected_result: 'DENIED',
        reason: 'MCP tokens do not have auth:manage scope',
      },
    ],
  })
}

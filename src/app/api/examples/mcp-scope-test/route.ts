/**
 * MCP Scope Enforcement Test Endpoint
 *
 * This endpoint demonstrates MCP scope enforcement at the gateway level.
 * It shows how read-only tokens are rejected for write operations.
 *
 * US-007: Implement MCP Scope Enforcement
 *
 * Usage:
 * - GET /api/examples/mcp-scope-test - Read operation (works with ro, rw, admin tokens)
 * - POST /api/examples/mcp-scope-test - Write operation (requires rw or admin tokens)
 * - DELETE /api/examples/mcp-scope-test - Admin operation (requires admin tokens only)
 *
 * Headers:
 * - x-api-key: Your MCP token
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  withApiKeyScope,
  type AuthenticatedApiKey,
} from '@/lib/middleware/api-key-auth'
import { getMcpAccessLevel, isMcpReadOnly } from '@/lib/mcp-scope-enforcement'

/**
 * GET /api/examples/mcp-scope-test
 *
 * Read operation - works with all MCP token types (ro, rw, admin)
 */
export const GET = withApiKeyScope(
  { operation: 'db:select' },
  async (req: NextRequest, params: {}, auth: AuthenticatedApiKey) => {
    const accessLevel = getMcpAccessLevel(auth.apiKey)

    return NextResponse.json({
      success: true,
      message: 'Read operation successful',
      data: {
        operation: 'db:select (read)',
        token_type: auth.apiKey.key_type,
        key_prefix: auth.apiKey.key_prefix,
        mcp_access_level: accessLevel,
        scopes: auth.apiKey.scopes,
        is_read_only: isMcpReadOnly(auth.apiKey),
      },
    })
  }
)

/**
 * POST /api/examples/mcp-scope-test
 *
 * Write operation - requires rw or admin MCP tokens
 * Read-only tokens will receive PERMISSION_DENIED
 */
export const POST = withApiKeyScope(
  { operation: 'db:insert' },
  async (req: NextRequest, params: {}, auth: AuthenticatedApiKey) => {
    const accessLevel = getMcpAccessLevel(auth.apiKey)

    return NextResponse.json({
      success: true,
      message: 'Write operation successful',
      data: {
        operation: 'db:insert (write)',
        token_type: auth.apiKey.key_type,
        key_prefix: auth.apiKey.key_prefix,
        mcp_access_level: accessLevel,
        scopes: auth.apiKey.scopes,
        is_read_only: isMcpReadOnly(auth.apiKey),
      },
    })
  }
)

/**
 * DELETE /api/examples/mcp-scope-test
 *
 * Admin operation - requires admin MCP tokens only
 * Read-only and read-write tokens will receive PERMISSION_DENIED
 */
export const DELETE = withApiKeyScope(
  { operation: 'db:delete' },
  async (req: NextRequest, params: {}, auth: AuthenticatedApiKey) => {
    const accessLevel = getMcpAccessLevel(auth.apiKey)

    return NextResponse.json({
      success: true,
      message: 'Admin operation successful',
      data: {
        operation: 'db:delete (admin)',
        token_type: auth.apiKey.key_type,
        key_prefix: auth.apiKey.key_prefix,
        mcp_access_level: accessLevel,
        scopes: auth.apiKey.scopes,
      },
    })
  }
)

/**
 * PUT /api/examples/mcp-scope-test
 *
 * Update operation - requires rw or admin MCP tokens
 */
export const PUT = withApiKeyScope(
  { operation: 'db:update' },
  async (req: NextRequest, params: {}, auth: AuthenticatedApiKey) => {
    const accessLevel = getMcpAccessLevel(auth.apiKey)

    return NextResponse.json({
      success: true,
      message: 'Update operation successful',
      data: {
        operation: 'db:update (write)',
        token_type: auth.apiKey.key_type,
        key_prefix: auth.apiKey.key_prefix,
        mcp_access_level: accessLevel,
        scopes: auth.apiKey.scopes,
      },
    })
  }
)

/**
 * Realtime Publish API
 *
 * Handles publishing messages to realtime channels.
 * Validates that the API key has permission to publish (write operation).
 *
 * US-007: MCP Scope Enforcement
 * - MCP read-only tokens cannot publish (denied with clear error)
 * - MCP write/admin tokens can publish
 * - Non-MCP tokens follow regular scope enforcement
 *
 * POST /api/realtime/publish
 * Headers: x-api-key: <api_key>
 * Body: { channel: string, message: any }
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, type ApiKeyAuth } from '@/lib/auth'
import {
  enforceScopeWithMcpRestrictions,
  isMcpToken,
  isMcpReadOnlyToken,
  type ScopeErrorResponse,
} from '@/lib/scope-enforcement'
import {
  validateChannelFormat,
  validateChannelSubscription,
} from '@/lib/middleware/realtime-scope'
import { createError, ErrorCode, type PlatformError } from '@/lib/errors'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'

/**
 * POST /api/realtime/publish
 *
 * Publish a message to a realtime channel
 *
 * Request headers:
 * - x-api-key: API key (MCP tokens: mcp_ro_*, mcp_rw_*, mcp_admin_*)
 *
 * Request body:
 * ```json
 * {
 *   "channel": "project_id:broadcast:updates",
 *   "message": { "type": "user_updated", "data": {...} }
 * }
 * ```
 *
 * Success response (200):
 * ```json
 * {
 *   "success": true,
 *   "channel": "project_id:broadcast:updates",
 *   "published_at": "2024-01-01T00:00:00.000Z",
 *   "message_id": "uuid"
 * }
 * ```
 *
 * Error response (403) - MCP read-only denied:
 * ```json
 * {
 *   "error": "PERMISSION_DENIED",
 *   "code": "MCP_WRITE_DENIED",
 *   "message": "MCP read-only token cannot perform write operations. This token has read-only access and cannot execute: realtime:publish. To perform write operations, use an MCP write token (mcp_rw_) or admin token (mcp_admin_).",
 *   "required_scope": "realtime:publish",
 *   "service": "realtime"
 * }
 * ```
 *
 * Error response (403) - Missing scope:
 * ```json
 * {
 *   "error": "PERMISSION_DENIED",
 *   "code": "MISSING_SCOPE",
 *   "message": "Missing required scope: realtime:publish. This key does not have permission to perform this operation.",
 *   "required_scope": "realtime:publish",
 *   "service": "realtime"
 * }
 * ```
 */
export async function POST(req: NextRequest) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req)

  try {
    // Extract API key from header
    const apiKeyHeader = req.headers.get('x-api-key')
    if (!apiKeyHeader) {
      const error = createError(
        ErrorCode.AUTHENTICATION_ERROR,
        'API key is required. Provide it via x-api-key header.'
      )
      return setCorrelationHeader(error.toNextResponse(), correlationId)
    }

    // Authenticate the API key
    const apiKeyAuth: ApiKeyAuth = await authenticateApiKey(apiKeyHeader)

    // Parse request body
    const body = await req.json()
    const { channel, message } = body

    if (!channel) {
      const error = createError(
        ErrorCode.VALIDATION_ERROR,
        'Channel is required. Format: project_id:channel_type:identifier'
      )
      return setCorrelationHeader(error.toNextResponse(), correlationId)
    }

    // Validate channel format
    try {
      validateChannelFormat(channel)
    } catch (error: any) {
      const validationError = createError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid channel format: ${error.message}`
      )
      return setCorrelationHeader(validationError.toNextResponse(), correlationId)
    }

    // Build ApiKey object for scope enforcement
    const apiKey = {
      id: apiKeyAuth.id,
      name: apiKeyAuth.name,
      key_type: apiKeyAuth.key_type as any,
      key_prefix: apiKeyAuth.key_prefix,
      scopes: apiKeyAuth.scopes as any[],
      environment: apiKeyAuth.environment as any,
      created_at: apiKeyAuth.created_at,
    }

    // US-007: Enforce MCP scope restrictions for publish operation
    try {
      enforceScopeWithMcpRestrictions(apiKey, 'realtime:publish')
    } catch (scopeError) {
      const error = scopeError as ScopeErrorResponse

      // Return 403 with scope error details
      const response = NextResponse.json(
        {
          error: error.error,
          code: error.code,
          message: error.message,
          required_scope: error.required_scope,
          service: error.service,
          channel,
          key_type: apiKeyAuth.key_type,
          key_prefix: apiKeyAuth.key_prefix,
          scopes: apiKeyAuth.scopes,
          is_mcp_token: isMcpToken(apiKey),
          is_mcp_read_only: isMcpReadOnlyToken(apiKey),
        },
        { status: 403 }
      )

      return setCorrelationHeader(response, correlationId)
    }

    // Validate that the channel belongs to the key's project
    // (This would require project_id in the ApiKeyAuth response)
    // For now, we'll proceed with the publish

    // Generate a message ID
    const messageId = crypto.randomUUID()
    const publishedAt = new Date().toISOString()

    // In a real implementation, this would publish to the realtime service
    // For now, we'll just return a success response
    return NextResponse.json(
      {
        success: true,
        channel,
        message,
        published_at: publishedAt,
        message_id: messageId,
        key_type: apiKeyAuth.key_type,
        key_prefix: apiKeyAuth.key_prefix,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Realtime Publish] Error:', error)

    // Handle PlatformError
    if (error.code) {
      const platformError = error as PlatformError
      return setCorrelationHeader(
        platformError.toNextResponse(),
        correlationId
      )
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      const validationError = createError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid JSON in request body'
      )
      return setCorrelationHeader(validationError.toNextResponse(), correlationId)
    }

    // Handle generic errors
    const internalError = createError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred'
    )
    return setCorrelationHeader(internalError.toNextResponse(), correlationId)
  }
}

/**
 * GET /api/realtime/publish
 *
 * Returns information about the publish endpoint and MCP scope enforcement
 */
export async function GET() {
  return NextResponse.json({
    message: 'Realtime Publish API',
    usage: {
      method: 'POST',
      url: '/api/realtime/publish',
      headers: {
        'x-api-key': 'Your API key',
        'Content-Type': 'application/json',
      },
      body: {
        channel: 'project_id:broadcast:updates',
        message: {
          type: 'event_name',
          data: { /* your event data */ },
        },
      },
    },
    scope_requirements: {
      operation: 'realtime:publish',
      description: 'Publish messages to realtime channels',
      required_scopes: ['realtime:publish'],
      mcp_token_restrictions: {
        mcp_ro_: {
          allowed: false,
          reason: 'Read-only tokens cannot publish',
        },
        mcp_rw_: {
          allowed: true,
          reason: 'Write tokens can publish',
        },
        mcp_admin_: {
          allowed: true,
          reason: 'Admin tokens can publish',
        },
      },
    },
    examples: [
      {
        description: 'Publish with MCP write token',
        api_key: 'mcp_rw_xxx',
        result: 'SUCCESS',
      },
      {
        description: 'Publish with MCP read-only token',
        api_key: 'mcp_ro_xxx',
        result: 'DENIED - MCP_WRITE_DENIED error',
      },
    ],
  })
}

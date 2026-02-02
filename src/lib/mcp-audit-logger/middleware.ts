/**
 * MCP Audit Logger - Middleware
 *
 * US-008: Implement MCP Audit Logging
 *
 * Middleware wrapper for automatically logging all MCP requests.
 *
 * Usage:
 * ```typescript
 * import { withMcpAuditLogging } from '@/lib/mcp-audit-logger/middleware'
 *
 * export async function POST(req: NextRequest) {
 *   const result = await withMcpAuditLogging(req, async (req, apiKey) => {
 *     // Your handler logic here
 *     return { success: true }
 *   })
 *
 *   return NextResponse.json(result)
 * }
 * ```
 */

import { NextRequest } from 'next/server'
import { authenticateApiKey, type ApiKeyAuth } from '@/lib/auth'
import { extractCorrelationId } from '@/lib/middleware/correlation'
import { logMcpAction } from './logger'
import { extractClientIp, extractUserAgent, parseMcpAccessLevel, determineOperation } from './utils'
import type { McpAuditHandler, McpAuditMiddlewareResult } from './types'

/**
 * Create MCP audit log middleware
 *
 * US-008: Creates middleware for logging all MCP requests
 *
 * @param req - The NextRequest object
 * @param handler - The handler function to wrap
 * @returns The handler result with audit logging
 */
export async function withMcpAuditLogging<T>(
  req: NextRequest,
  handler: McpAuditHandler<T>
): Promise<McpAuditMiddlewareResult<T>> {
  const apiKeyHeader = req.headers.get('x-api-key')

  if (!apiKeyHeader) {
    return {
      error: 'API key is required for MCP audit logging',
      statusCode: 401,
    }
  }

  // Declare variables outside try block so they're accessible in catch block
  let apiKey: ApiKeyAuth | undefined
  let startTime = Date.now()
  let url = req.nextUrl
  let method = req.method
  let payload: Record<string, unknown> = {}

  try {
    // Authenticate API key
    apiKey = await authenticateApiKey(apiKeyHeader)

    // Check if this is an MCP token
    if (apiKey.key_type !== 'mcp') {
      // Not an MCP token, just execute the handler
      return handler(req, apiKey)
    }

    startTime = Date.now()
    url = req.nextUrl
    method = req.method

    // Parse request body for payload
    try {
      if (req.body) {
        // Clone the body for logging
        const bodyClone = new Request(req.clone())
        payload = await bodyClone.json().catch(() => ({}))
      }
    } catch {
      // Body already consumed or not JSON
    }

    // Execute the handler
    const result = await handler(req, apiKey)
    const responseTimeMs = Date.now() - startTime

    // US-008: Extract correlation ID for request tracing
    const requestId = extractCorrelationId(req)

    // Log the MCP action
    await logMcpAction({
      apiKeyId: apiKey.id,
      projectId: apiKey.project_id,
      keyType: apiKey.key_type,
      keyPrefix: apiKey.key_prefix,
      operation: determineOperation(url, method, payload),
      endpoint: url.pathname,
      method,
      payload,
      mcpAccessLevel: parseMcpAccessLevel(apiKey.key_prefix),
      statusCode: result.statusCode,
      responseTimeMs,
      ipAddress: extractClientIp(req),
      userAgent: extractUserAgent(req),
      requestId: requestId ?? undefined,
      occurredAt: new Date(),
    })

    return result
  } catch (error: any) {
    // Only log if we have an API key (i.e., authentication succeeded)
    if (!apiKey) {
      throw error
    }

    const responseTimeMs = Date.now() - startTime

    // US-008: Extract correlation ID for request tracing
    const requestId = extractCorrelationId(req)

    // Log failed MCP action
    try {
      await logMcpAction({
        apiKeyId: apiKey.id,
        projectId: apiKey.project_id,
        keyType: apiKey.key_type,
        keyPrefix: apiKey.key_prefix,
        operation: determineOperation(url, method, payload),
        endpoint: url.pathname,
        method,
        payload,
        mcpAccessLevel: parseMcpAccessLevel(apiKey.key_prefix),
        statusCode: 500,
        responseTimeMs,
        ipAddress: extractClientIp(req),
        userAgent: extractUserAgent(req),
        requestId: requestId ?? undefined,
        occurredAt: new Date(),
      })
    } catch (logError) {
      console.error('[MCP Audit Logger] Failed to log failed MCP action:', logError)
    }

    throw error
  }
}

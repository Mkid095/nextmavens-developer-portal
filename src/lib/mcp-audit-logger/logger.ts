/**
 * MCP Audit Logger - Core Logging Functions
 *
 * US-008: Implement MCP Audit Logging
 *
 * Core functions for logging MCP audit events including actions,
 * scope checks, and authentication failures.
 */

import { NextRequest } from 'next/server'
import { getPool } from '@/lib/db'
import { extractCorrelationId } from '@/lib/middleware/correlation'
import type { ApiKeyAuth } from '@/lib/auth'
import {
  AUDIT_LOG_TYPES,
  SEVERITY_LEVELS,
} from './constants'
import {
  detectAiTool,
  extractIdeVersion,
  extractClientIp,
  extractUserAgent,
  parseMcpAccessLevel,
  sanitizePayload,
  getSeverityForStatusCode,
} from './utils'
import type { McpAuditLogEntry } from './types'

/**
 * Log an MCP operation to the audit log
 *
 * US-008: All MCP requests logged to audit_logs
 *
 * @param entry - The MCP audit log entry
 */
export async function logMcpAction(entry: McpAuditLogEntry): Promise<void> {
  const pool = getPool()

  try {
    // Detect AI tool and IDE version from user agent
    const aiTool = detectAiTool(entry.userAgent) || detectAiTool(entry.userAgent + ' (fallback)')
    const ideVersion = extractIdeVersion(entry.userAgent)

    // Sanitize payload for logging (remove sensitive data if any)
    const sanitizedPayload = sanitizePayload(entry.payload)

    // Build details JSON
    const details = {
      api_key_id: entry.apiKeyId,
      key_type: entry.keyType,
      key_prefix: entry.keyPrefix,
      mcp_access_level: entry.mcpAccessLevel,
      operation: entry.operation,
      endpoint: entry.endpoint,
      method: entry.method,
      payload: sanitizedPayload,
      status_code: entry.statusCode,
      response_time_ms: entry.responseTimeMs,
      ai_tool: aiTool,
      ide_version: ideVersion,
      ai_detected: !!aiTool,
    }

    // Insert into audit_logs table
    // US-008: Added request_id column for correlation tracking
    await pool.query(
      `
      INSERT INTO audit_logs (
        log_type,
        severity,
        project_id,
        developer_id,
        action,
        details,
        ip_address,
        user_agent,
        occurred_at,
        request_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        AUDIT_LOG_TYPES.MCP_TOKEN_ACTION,
        getSeverityForStatusCode(entry.statusCode || 200),
        entry.projectId,
        null, // developer_id - for MCP tokens, we use the API key ID
        `${entry.method} ${entry.endpoint}`,
        JSON.stringify(details),
        entry.ipAddress,
        `${entry.userAgent}${aiTool ? ` | AI: ${aiTool}${ideVersion ? ` | IDE: ${ideVersion}` : ''}` : ''}`,
        entry.occurredAt,
        entry.requestId || null,
      ]
    )

    // Also log to console for immediate visibility
    const consoleMessage = `[MCP Audit] ${entry.method} ${entry.endpoint} | ${entry.operation} | ${entry.keyPrefix}`
    console.log(consoleMessage, {
      projectId: entry.projectId,
      apiKeyId: entry.apiKeyId,
      mcpAccessLevel: entry.mcpAccessLevel,
      aiTool,
      ideVersion,
      statusCode: entry.statusCode,
      responseTimeMs: entry.responseTimeMs,
    })
  } catch (error) {
    console.error('[MCP Audit Logger] Failed to log MCP audit entry:', error)
    // Don't throw - logging failure shouldn't break the application
  }
}

/**
 * Log MCP scope check (for enforcement failures)
 * US-008: Added requestId for correlation tracking
 *
 * @param req - The NextRequest object
 * @param apiKey - The API key auth result
 * @param operation - The operation being checked
 * @param allowed - Whether the operation was allowed
 * @param reason - The reason if not allowed
 */
export async function logMcpScopeCheck(
  req: NextRequest,
  apiKey: ApiKeyAuth,
  operation: string,
  allowed: boolean,
  reason?: string
): Promise<void> {
  const url = req.nextUrl
  const requestId = extractCorrelationId(req)

  await logMcpAction({
    apiKeyId: apiKey.id,
    projectId: apiKey.project_id,
    keyType: apiKey.key_type,
    keyPrefix: apiKey.key_prefix,
    operation: `scope_check:${operation}`,
    endpoint: url.pathname,
    method: req.method,
    payload: {
      allowed,
      reason: reason || (allowed ? 'Scope check passed' : 'Scope check failed'),
      checked_operation: operation,
    },
    mcpAccessLevel: parseMcpAccessLevel(apiKey.key_prefix),
    statusCode: allowed ? 200 : 403,
    ipAddress: extractClientIp(req),
    userAgent: extractUserAgent(req),
    requestId: requestId ?? undefined,
    occurredAt: new Date(),
  })
}

/**
 * Log MCP authentication failure
 * US-008: Added requestId for correlation tracking
 *
 * @param req - The NextRequest object
 * @param reason - The reason for authentication failure
 */
export async function logMcpAuthFailure(req: NextRequest, reason: string): Promise<void> {
  const pool = getPool()

  try {
    const ipAddress = extractClientIp(req)
    const userAgent = extractUserAgent(req)
    const aiTool = detectAiTool(userAgent)
    const requestId = extractCorrelationId(req)

    await pool.query(
      `
      INSERT INTO audit_logs (
        log_type,
        severity,
        action,
        details,
        ip_address,
        user_agent,
        occurred_at,
        request_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        AUDIT_LOG_TYPES.MCP_AUTH_FAILURE,
        SEVERITY_LEVELS.WARNING,
        'MCP authentication failed',
        JSON.stringify({
          reason,
          ai_tool: aiTool,
          ai_detected: !!aiTool,
          endpoint: req.nextUrl.pathname,
          method: req.method,
        }),
        ipAddress,
        `${userAgent}${aiTool ? ` | AI: ${aiTool}` : ''}`,
        new Date(),
        requestId ?? undefined,
      ]
    )

    console.warn('[MCP Audit] Authentication failure', {
      reason,
      aiTool,
      requestId: requestId ?? undefined,
      endpoint: req.nextUrl.pathname,
      ipAddress,
    })
  } catch (error) {
    console.error('[MCP Audit Logger] Failed to log auth failure:', error)
  }
}

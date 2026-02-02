/**
 * MCP Audit Logger
 *
 * US-008: Implement MCP Audit Logging
 *
 * Provides comprehensive audit logging for MCP (Model Context Protocol) token operations.
 * All MCP actions are heavily audited to detect AI tool abuse.
 *
 * Audit log entries include:
 * - actor_type = 'mcp_token'
 * - Full payload captured (for forensics)
 * - AI/IDE identified from user_agent
 * - Project_id captured
 */

import { NextRequest } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateApiKey, type ApiKeyAuth } from '@/lib/auth'

/**
 * US-008: Import correlation ID utilities
 */
import { extractCorrelationId } from '@/lib/middleware/correlation'

/**
 * MCP audit log entry structure
 * US-008: Added requestId field for correlation tracking
 */
export interface McpAuditLogEntry {
  apiKeyId: string
  projectId: string
  keyType: string
  keyPrefix: string
  operation: string
  endpoint: string
  method: string
  payload: Record<string, unknown>
  mcpAccessLevel: 'ro' | 'rw' | 'admin' | 'unknown'
  statusCode?: number
  responseTimeMs?: number
  ipAddress: string
  userAgent: string
  requestId?: string // US-008: Correlation ID from x-request-id header
  aiTool?: string // Detected AI/IDE tool from user agent
  ideVersion?: string // Extracted IDE version if available
  occurredAt: Date
}

/**
 * AI tool patterns for detection from user agent
 */
const AI_TOOL_PATTERNS: Record<string, RegExp> = {
  'Cursor AI': /cursor/i,
  'Claude': /claude/i,
  'Copilot': /copilot/i,
  'ChatGPT': /chatgpt/i,
  'Codeium': /codeium/i,
  'Tabnine': /tabnine/i,
  'Amazon Q': /amazon\s*q/i,
  'CodeWhisperer': /codewhisperer/i,
  'Continue': /continue/i,
  'Replit': /replit/i,
  'Bolt.new': /bolt\.new/i,
  'v0.dev': /v0\.dev/i,
  'Codium': /codium/i,
  'Aider': /aider/i,
  'Sweep': /sweep/i,
  'AutoCode': /autocode/i,
}

/**
 * IDE version patterns
 */
const IDE_VERSION_PATTERNS = [
  /vscode\/([\d.]+)/i,
  /jetbrains/i,
  /intellij\s+idea/i,
  /pycharm/i,
  /webstorm/i,
  /sublime\s+text/i,
  /vim/i,
  /neovim/i,
  /emacs/i,
]

/**
 * Detect AI tool from user agent string
 *
 * @param userAgent - The user agent string
 * @returns The detected AI tool name or undefined
 */
export function detectAiTool(userAgent: string): string | undefined {
  for (const [tool, pattern] of Object.entries(AI_TOOL_PATTERNS)) {
    if (pattern.test(userAgent)) {
      return tool
    }
  }
  return undefined
}

/**
 * Extract IDE version from user agent string
 *
 * @param userAgent - The user agent string
 * @returns The IDE version string or undefined
 */
export function extractIdeVersion(userAgent: string): string | undefined {
  const vscodeMatch = userAgent.match(/vscode\/([\d.]+)/i)
  if (vscodeMatch) {
    return `VSCode ${vscodeMatch[1]}`
  }

  // Check for JetBrains IDEs
  if (/jetbrains/i.test(userAgent)) {
    const ideaMatch = userAgent.match(/intellij\s+idea\s+([\d.]+)/i)
    if (ideaMatch) {
      return `IntelliJ IDEA ${ideaMatch[1]}`
    }
    return 'JetBrains IDE'
  }

  // Check for specific JetBrains IDEs
  if (/pycharm/i.test(userAgent)) {
    return 'PyCharm'
  }
  if (/webstorm/i.test(userAgent)) {
    return 'WebStorm'
  }

  // Check for Vim/Neovim
  if (/neovim\/([\d.]+)/i.test(userAgent)) {
    const neovimMatch = userAgent.match(/neovim\/([\d.]+)/i)
    if (neovimMatch) {
      return `Neovim ${neovimMatch[1]}`
    }
  }
  if (/vim/i.test(userAgent)) {
    return 'Vim'
  }

  return undefined
}

/**
 * Parse MCP access level from key prefix
 *
 * @param keyPrefix - The API key prefix (e.g., mcp_ro_, mcp_rw_)
 * @returns The MCP access level
 */
export function parseMcpAccessLevel(keyPrefix: string): 'ro' | 'rw' | 'admin' | 'unknown' {
  if (keyPrefix.startsWith('mcp_ro_')) {
    return 'ro'
  }
  if (keyPrefix.startsWith('mcp_rw_')) {
    return 'rw'
  }
  if (keyPrefix.startsWith('mcp_admin_')) {
    return 'admin'
  }
  return 'unknown'
}

/**
 * Extract IP address from request
 *
 * @param req - The NextRequest object
 * @returns The client IP address
 */
export function extractClientIp(req: NextRequest): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Try cf-connecting-ip header (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  // Try x-real-ip header (Nginx)
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to connection info
  // @ts-ignore - ipAddress may be available in some environments
  if (req.ip) {
    return req.ip
  }

  return '0.0.0.0'
}

/**
 * Extract user agent from request
 *
 * @param req - The NextRequest object
 * @returns The user agent string
 */
export function extractUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'Unknown'
}

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
        'mcp_token_action', // log_type
        getSeverityForStatusCode(entry.statusCode || 200), // severity
        entry.projectId,
        null, // developer_id - for MCP tokens, we use the API key ID
        `${entry.method} ${entry.endpoint}`, // action
        JSON.stringify(details), // details (full payload captured)
        entry.ipAddress,
        `${entry.userAgent}${aiTool ? ` | AI: ${aiTool}${ideVersion ? ` | IDE: ${ideVersion}` : ''}` : ''}`, // user_agent with AI/IDE info
        entry.occurredAt,
        entry.requestId || null, // US-008: Correlation ID from x-request-id header
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
 * Get severity level based on HTTP status code
 *
 * @param statusCode - The HTTP status code
 * @returns The severity level
 */
function getSeverityForStatusCode(statusCode: number): 'info' | 'warning' | 'error' | 'critical' {
  if (statusCode >= 500) {
    return 'critical'
  }
  if (statusCode >= 400) {
    return 'warning'
  }
  return 'info'
}

/**
 * Sanitize payload to remove sensitive data
 *
 * @param payload - The request payload
 * @returns Sanitized payload
 */
function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...payload }

  // Redact sensitive fields that might contain credentials
  const sensitiveFields = ['password', 'secret', 'token', 'apiKey', 'api_key', 'private_key', 'secret_key']

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * Create MCP audit log middleware
 *
 * US-008: Creates middleware for logging all MCP requests
 *
 * Usage:
 * ```typescript
 * import { withMcpAuditLogging } from '@/lib/mcp-audit-logger'
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
 *
 * @param req - The NextRequest object
 * @param handler - The handler function to wrap
 * @returns The handler result with audit logging
 */
export async function withMcpAuditLogging<T>(
  req: NextRequest,
  handler: (req: NextRequest, apiKey: ApiKeyAuth) => Promise<{
    data?: T
    statusCode?: number
    error?: string
  }>
): Promise<{ data?: T; statusCode?: number; error?: string }> {
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
      requestId: requestId ?? undefined, // US-008: Correlation ID
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
        requestId: requestId ?? undefined, // US-008: Correlation ID
        occurredAt: new Date(),
      })
    } catch (logError) {
      console.error('[MCP Audit Logger] Failed to log failed MCP action:', logError)
    }

    throw error
  }
}

/**
 * Determine the operation type from request details
 *
 * @param url - The request URL
 * @param method - The HTTP method
 * @param payload - The request payload
 * @returns The operation string
 */
function determineOperation(
  url: URL,
  method: string,
  payload: Record<string, unknown>
): string {
  // Extract operation from URL path
  const pathParts = url.pathname.split('/').filter(Boolean)

  // For /api/test/mcp-scope, return "test_scope_check"
  if (pathParts[0] === 'api' && pathParts[1] === 'test' && pathParts[2] === 'mcp-scope') {
    return 'test_scope_check'
  }

  // For /api/realtime/publish, return "realtime_publish"
  if (pathParts[0] === 'api' && pathParts[1] === 'realtime' && pathParts[2] === 'publish') {
    return 'realtime_publish'
  }

  // For database operations
  if (pathParts[1] === 'database') {
    return `database_${method.toLowerCase()}`
  }

  // For storage operations
  if (pathParts[1] === 'storage') {
    return `storage_${method.toLowerCase()}`
  }

  // Default: method_endpoint
  return `${method.toLowerCase()}_${pathParts.slice(-1).join('/') || 'unknown'}`
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
  const requestId = extractCorrelationId(req) // US-008: Extract correlation ID

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
    requestId: requestId ?? undefined, // US-008: Correlation ID
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
    const requestId = extractCorrelationId(req) // US-008: Extract correlation ID

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
        'mcp_auth_failure',
        'warning',
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
        requestId ?? undefined, // US-008: Correlation ID
      ]
    )

    console.warn('[MCP Audit] Authentication failure', {
      reason,
      aiTool,
      requestId: requestId ?? undefined, // US-008: Include in console log
      endpoint: req.nextUrl.pathname,
      ipAddress,
    })
  } catch (error) {
    console.error('[MCP Audit Logger] Failed to log auth failure:', error)
  }
}

/**
 * Get MCP audit logs for a project
 *
 * @param projectId - The project ID
 * @param options - Query options
 * @returns Array of MCP audit log entries
 */
export async function getMcpAuditLogs(
  projectId: string,
  options: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<{
  logs: Array<{
    id: string
    apiKeyId: string
    projectId: string
    keyType: string
    keyPrefix: string
    operation: string
    endpoint: string
    method: string
    payload: Record<string, unknown>
    mcpAccessLevel: 'ro' | 'rw' | 'admin' | 'unknown'
    statusCode?: number
    responseTimeMs?: number
    ipAddress: string
    userAgent: string
    aiTool?: string
    ideVersion?: string
    occurredAt: Date
  }>
  total: number
}> {
  const pool = getPool()

  try {
    const { limit = 100, offset = 0, startDate, endDate } = options

    // Build query with filters
    let query = `
      SELECT
        id,
        details,
        ip_address,
        user_agent,
        occurred_at
      FROM audit_logs
      WHERE log_type = 'mcp_token_action'
        AND project_id = $1
    `

    const params: any[] = [projectId]

    // Add date range filters
    if (startDate) {
      query += ` AND occurred_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND occurred_at <= $${params.length + 1}`
      params.push(endDate)
    }

    // Add ordering and pagination
    query += ` ORDER BY occurred_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      WHERE log_type = 'mcp_token_action'
        AND project_id = $1
    `

    const countParams: any[] = [projectId]

    if (startDate) {
      countQuery += ` AND occurred_at >= $${countParams.length + 1}`
      countParams.push(startDate)
    }

    if (endDate) {
      countQuery += ` AND occurred_at <= $${countParams.length + 1}`
      countParams.push(endDate)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    // Parse and format results
    const logs = result.rows.map((row: any) => {
      const details = JSON.parse(row.details)

      return {
        id: row.id,
        apiKeyId: details.api_key_id,
        projectId,
        keyType: details.key_type,
        keyPrefix: details.key_prefix,
        operation: details.operation,
        endpoint: details.endpoint,
        method: details.method,
        payload: details.payload,
        mcpAccessLevel: details.mcp_access_level,
        statusCode: details.status_code,
        responseTimeMs: details.response_time_ms,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        aiTool: details.ai_tool,
        ideVersion: details.ide_version,
        occurredAt: row.occurred_at,
      }
    })

    return { logs, total }
  } catch (error) {
    console.error('[MCP Audit Logger] Failed to get MCP audit logs:', error)
    throw error
  }
}

/**
 * Get MCP audit statistics for a project
 *
 * @param projectId - The project ID
 * @returns MCP usage statistics
 */
export async function getMcpAuditStats(projectId: string): Promise<{
  totalRequests: number
  requestsByAccessLevel: Record<string, number>
  requestsByOperation: Record<string, number>
  requestsByAiTool: Record<string, number>
  averageResponseTime: number
  errorRate: number
}> {
  const pool = getPool()

  try {
    // Get all MCP audit logs for the project
    const result = await pool.query(
      `
      SELECT details, occurred_at
      FROM audit_logs
      WHERE log_type = 'mcp_token_action'
        AND project_id = $1
      ORDER BY occurred_at DESC
      `,
      [projectId]
    )

    const logs = result.rows.map((row: any) => JSON.parse(row.details))

    // Calculate statistics
    const totalRequests = logs.length
    const requestsByAccessLevel: Record<string, number> = { ro: 0, rw: 0, admin: 0, unknown: 0 }
    const requestsByOperation: Record<string, number> = {}
    const requestsByAiTool: Record<string, number> = {}
    let totalResponseTime = 0
    let errorCount = 0

    for (const log of logs) {
      // Count by access level
      requestsByAccessLevel[log.mcp_access_level]++

      // Count by operation
      requestsByOperation[log.operation] = (requestsByOperation[log.operation] || 0) + 1

      // Count by AI tool
      if (log.ai_tool) {
        requestsByAiTool[log.ai_tool] = (requestsByAiTool[log.ai_tool] || 0) + 1
      }

      // Sum response times
      if (log.response_time_ms) {
        totalResponseTime += log.response_time_ms
      }

      // Count errors
      if (log.status_code >= 400) {
        errorCount++
      }
    }

    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0

    return {
      totalRequests,
      requestsByAccessLevel,
      requestsByOperation,
      requestsByAiTool,
      averageResponseTime,
      errorRate,
    }
  } catch (error) {
    console.error('[MCP Audit Logger] Failed to get MCP audit stats:', error)
    throw error
  }
}

/**
 * Get MCP usage analytics per token
 *
 * US-011: Track usage per MCP token with request count, operations, and success/error rate
 *
 * @param projectId - The project ID
 * @param options - Query options
 * @returns MCP token usage analytics
 */
export async function getMcpTokenUsageAnalytics(
  projectId: string,
  options: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<{
  tokens: Array<{
    apiKeyId: string
    keyPrefix: string
    keyName: string
    mcpAccessLevel: 'ro' | 'rw' | 'admin' | 'unknown'
    requestCount: number
    operationsPerformed: Array<{
      operation: string
      count: number
    }>
    successCount: number
    errorCount: number
    successRate: number
    errorRate: number
    averageResponseTime: number
    lastUsed: Date | null
    firstUsed: Date | null
    aiToolsUsed: string[]
  }>
  total: number
}> {
  const pool = getPool()

  try {
    const { limit = 100, offset = 0, startDate, endDate } = options

    // Build query with filters
    let query = `
      SELECT
        id,
        details,
        occurred_at
      FROM audit_logs
      WHERE log_type = 'mcp_token_action'
        AND project_id = $1
    `

    const params: any[] = [projectId]

    // Add date range filters
    if (startDate) {
      query += ` AND occurred_at >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND occurred_at <= $${params.length + 1}`
      params.push(endDate)
    }

    query += ` ORDER BY occurred_at DESC`

    const result = await pool.query(query, params)
    const logs = result.rows.map((row: any) => ({
      id: row.id,
      details: JSON.parse(row.details),
      occurredAt: row.occurred_at,
    }))

    // Group logs by API key
    const tokenStats: Record<
      string,
      {
        apiKeyId: string
        keyPrefix: string
        keyName: string
        mcpAccessLevel: 'ro' | 'rw' | 'admin' | 'unknown'
        requestCount: number
        operations: Record<string, number>
        successCount: number
        errorCount: number
        totalResponseTime: number
        lastUsed: Date | null
        firstUsed: Date | null
        aiTools: Set<string>
      }
    > = {}

    for (const log of logs) {
      const details = log.details
      const apiKeyId = details.api_key_id

      if (!tokenStats[apiKeyId]) {
        tokenStats[apiKeyId] = {
          apiKeyId,
          keyPrefix: details.key_prefix,
          keyName: details.key_prefix, // We'll use prefix as name, can be improved by joining with api_keys table
          mcpAccessLevel: details.mcp_access_level,
          requestCount: 0,
          operations: {},
          successCount: 0,
          errorCount: 0,
          totalResponseTime: 0,
          lastUsed: log.occurredAt,
          firstUsed: log.occurredAt,
          aiTools: new Set(),
        }
      }

      const stats = tokenStats[apiKeyId]
      stats.requestCount++

      // Track operations
      const operation = details.operation
      stats.operations[operation] = (stats.operations[operation] || 0) + 1

      // Track success/error
      if (details.status_code >= 400) {
        stats.errorCount++
      } else {
        stats.successCount++
      }

      // Track response time
      if (details.response_time_ms) {
        stats.totalResponseTime += details.response_time_ms
      }

      // Update timestamps
      if (!stats.lastUsed || log.occurredAt > stats.lastUsed) {
        stats.lastUsed = log.occurredAt
      }
      if (!stats.firstUsed || log.occurredAt < stats.firstUsed) {
        stats.firstUsed = log.occurredAt
      }

      // Track AI tools
      if (details.ai_tool) {
        stats.aiTools.add(details.ai_tool)
      }
    }

    // Convert to array and calculate derived stats
    const tokens = Object.values(tokenStats).map((stats) => {
      const successRate = stats.requestCount > 0 ? (stats.successCount / stats.requestCount) * 100 : 0
      const errorRate = stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0
      const averageResponseTime = stats.requestCount > 0 ? stats.totalResponseTime / stats.requestCount : 0

      // Convert operations to sorted array
      const operationsPerformed = Object.entries(stats.operations)
        .map(([operation, count]) => ({ operation, count }))
        .sort((a, b) => b.count - a.count)

      return {
        apiKeyId: stats.apiKeyId,
        keyPrefix: stats.keyPrefix,
        keyName: stats.keyName,
        mcpAccessLevel: stats.mcpAccessLevel,
        requestCount: stats.requestCount,
        operationsPerformed,
        successCount: stats.successCount,
        errorCount: stats.errorCount,
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        lastUsed: stats.lastUsed,
        firstUsed: stats.firstUsed,
        aiToolsUsed: Array.from(stats.aiTools),
      }
    })

    // Sort by request count (most used first)
    tokens.sort((a, b) => b.requestCount - a.requestCount)

    // Apply pagination
    const total = tokens.length
    const paginatedTokens = tokens.slice(offset, offset + limit)

    return {
      tokens: paginatedTokens,
      total,
    }
  } catch (error) {
    console.error('[MCP Audit Logger] Failed to get MCP token usage analytics:', error)
    throw error
  }
}

/**
 * Export MCP token usage analytics as CSV
 *
 * US-011: Exportable for analysis
 *
 * @param projectId - The project ID
 * @param options - Query options
 * @returns CSV string
 */
export async function exportMcpTokenUsageAnalyticsAsCsv(
  projectId: string,
  options: {
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<string> {
  const analytics = await getMcpTokenUsageAnalytics(projectId, {
    limit: 10000, // Large limit for export
    offset: 0,
    ...options,
  })

  // CSV headers
  const headers = [
    'API Key ID',
    'Key Prefix',
    'Access Level',
    'Request Count',
    'Success Count',
    'Error Count',
    'Success Rate (%)',
    'Error Rate (%)',
    'Avg Response Time (ms)',
    'First Used',
    'Last Used',
    'AI Tools Used',
    'Top Operations',
  ]

  // Build CSV rows
  const rows = analytics.tokens.map((token) => {
    const topOperations = token.operationsPerformed
      .slice(0, 5)
      .map((op) => `${op.operation} (${op.count})`)
      .join('; ')

    return [
      token.apiKeyId,
      token.keyPrefix,
      token.mcpAccessLevel,
      token.requestCount.toString(),
      token.successCount.toString(),
      token.errorCount.toString(),
      token.successRate.toString(),
      token.errorRate.toString(),
      token.averageResponseTime.toString(),
      token.firstUsed ? token.firstUsed.toISOString() : 'N/A',
      token.lastUsed ? token.lastUsed.toISOString() : 'N/A',
      token.aiToolsUsed.join(', '),
      topOperations,
    ].map((field) => `"${field.replace(/"/g, '""')}"`).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

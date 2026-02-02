/**
 * MCP Audit Logger - Query Functions
 *
 * US-008: Implement MCP Audit Logging
 * US-011: Track usage per MCP token
 *
 * Functions for querying and analyzing MCP audit logs,
 * including statistics, token usage analytics, and CSV export.
 */

import { getPool } from '@/lib/db'
import { AUDIT_LOG_TYPES, DEFAULT_LIMIT, DEFAULT_OFFSET, EXPORT_LIMIT } from './constants'
import type {
  AuditLogQueryOptions,
  McpAuditLog,
  McpAuditStats,
  McpTokenUsageAnalytics,
} from './types'

/**
 * Get MCP audit logs for a project
 *
 * @param projectId - The project ID
 * @param options - Query options
 * @returns Array of MCP audit log entries
 */
export async function getMcpAuditLogs(
  projectId: string,
  options: AuditLogQueryOptions = {}
): Promise<{
  logs: McpAuditLog[]
  total: number
}> {
  const pool = getPool()

  try {
    const { limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET, startDate, endDate } = options

    // Build query with filters
    let query = `
      SELECT
        id,
        details,
        ip_address,
        user_agent,
        occurred_at
      FROM audit_logs
      WHERE log_type = $1
        AND project_id = $2
    `

    const params: any[] = [AUDIT_LOG_TYPES.MCP_TOKEN_ACTION, projectId]

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
      WHERE log_type = $1
        AND project_id = $2
    `

    const countParams: any[] = [AUDIT_LOG_TYPES.MCP_TOKEN_ACTION, projectId]

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
export async function getMcpAuditStats(projectId: string): Promise<McpAuditStats> {
  const pool = getPool()

  try {
    // Get all MCP audit logs for the project
    const result = await pool.query(
      `
      SELECT details, occurred_at
      FROM audit_logs
      WHERE log_type = $1
        AND project_id = $2
      ORDER BY occurred_at DESC
      `,
      [AUDIT_LOG_TYPES.MCP_TOKEN_ACTION, projectId]
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

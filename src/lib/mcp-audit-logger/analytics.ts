/**
 * MCP Audit Logger - Token Usage Analytics
 *
 * US-011: Track usage per MCP token with request count, operations, and success/error rate
 *
 * Functions for querying MCP token usage analytics and exporting data.
 */

import { getPool } from '@/lib/db'
import { AUDIT_LOG_TYPES, EXPORT_LIMIT, DEFAULT_LIMIT, DEFAULT_OFFSET } from './constants'
import type { AuditLogQueryOptions, McpTokenUsageAnalytics } from './types'

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
  options: AuditLogQueryOptions = {}
): Promise<McpTokenUsageAnalytics> {
  const pool = getPool()

  try {
    const { limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET, startDate, endDate } = options

    // Build query with filters
    let query = `
      SELECT
        id,
        details,
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
  options: Omit<AuditLogQueryOptions, 'limit' | 'offset'> = {}
): Promise<string> {
  const analytics = await getMcpTokenUsageAnalytics(projectId, {
    limit: EXPORT_LIMIT,
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
    ]
      .map((field) => `"${(field || '').replace(/"/g, '""')}"`)
      .join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { z } from 'zod'

/**
 * US-011: MCP Usage Analytics API
 *
 * Provides usage analytics for MCP tokens including:
 * - Request count per token
 * - Operations performed
 * - Success/error rates
 * - AI tools used
 * - Response times
 */

// Query schema for MCP analytics
const mcpAnalyticsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  key_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

type McpAnalyticsQuery = z.infer<typeof mcpAnalyticsQuerySchema>

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project access
async function validateProjectAccess(
  projectId: string,
  developer: JwtPayload
): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT developer_id FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return false
  }

  const project = result.rows[0]
  return project.developer_id === developer.id
}

/**
 * GET /v1/mcp-analytics - Get MCP token usage analytics
 *
 * US-011: Track usage per MCP token, show request count, operations, success/error rate
 */
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: McpAnalyticsQuery = {
      limit: 50,
      offset: 0,
    }
    try {
      query = mcpAnalyticsQuerySchema.parse(queryParams)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // If project_id is provided, validate access
    if (query.project_id) {
      const hasAccess = await validateProjectAccess(query.project_id, developer)
      if (!hasAccess) {
        return errorResponse('PERMISSION_DENIED', 'You do not have access to this project', 403)
      }
    }

    // Build query conditions
    const conditions: string[] = [`log_type = 'mcp_token_action'`]
    const values: any[] = []
    let paramIndex = 1

    if (query.project_id) {
      conditions.push(`project_id = $${paramIndex++}`)
      values.push(query.project_id)
    } else {
      // If no project filter, only show logs for user's projects
      conditions.push(`project_id IN (SELECT id FROM projects WHERE developer_id = $${paramIndex++})`)
      values.push(developer.id)
    }

    // Filter by specific API key
    if (query.key_id) {
      conditions.push(`details->>'api_key_id' = $${paramIndex++}`)
      values.push(query.key_id)
    }

    // Filter by date range
    if (query.start_date) {
      conditions.push(`occurred_at >= $${paramIndex++}`)
      values.push(query.start_date)
    }

    if (query.end_date) {
      conditions.push(`occurred_at <= $${paramIndex++}`)
      values.push(query.end_date)
    }

    // Get all matching audit logs
    const logsResult = await pool.query(
      `SELECT id, details, occurred_at
       FROM audit_logs
       WHERE ${conditions.join(' AND ')}
       ORDER BY occurred_at DESC`,
      values
    )

    // Group logs by API key
    const tokenStats: Record<
      string,
      {
        apiKeyId: string
        keyPrefix: string
        projectId: string
        mcpAccessLevel: string
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

    for (const row of logsResult.rows) {
      const details = JSON.parse(row.details)
      const apiKeyId = details.api_key_id

      if (!tokenStats[apiKeyId]) {
        tokenStats[apiKeyId] = {
          apiKeyId,
          keyPrefix: details.key_prefix,
          projectId: details.project_id || query.project_id || '',
          mcpAccessLevel: details.mcp_access_level,
          requestCount: 0,
          operations: {},
          successCount: 0,
          errorCount: 0,
          totalResponseTime: 0,
          lastUsed: row.occurred_at,
          firstUsed: row.occurred_at,
          aiTools: new Set(),
        }
      }

      const stats = tokenStats[apiKeyId]
      stats.requestCount++

      // Track operations
      const operation = details.operation || 'unknown'
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
      if (!stats.lastUsed || row.occurred_at > stats.lastUsed) {
        stats.lastUsed = row.occurred_at
      }
      if (!stats.firstUsed || row.occurred_at < stats.firstUsed) {
        stats.firstUsed = row.occurred_at
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
        projectId: stats.projectId,
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
    const offset = query.offset
    const limit = query.limit
    const paginatedTokens = tokens.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedTokens,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error fetching MCP analytics:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch MCP analytics', 500)
  }
}


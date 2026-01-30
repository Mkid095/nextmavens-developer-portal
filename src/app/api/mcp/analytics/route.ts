/**
 * MCP Usage Analytics API
 *
 * US-011: Implement MCP Usage Analytics
 *
 * Provides API endpoints for tracking and viewing MCP token usage analytics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/auth'
import { getMcpTokenUsageAnalytics, exportMcpTokenUsageAnalyticsAsCsv } from '@/lib/mcp-audit-logger'

/**
 * GET /api/mcp/analytics
 *
 * Get MCP usage analytics for a project.
 *
 * Query parameters:
 * - project_id: The project ID (required)
 * - limit: Number of results to return (default: 100)
 * - offset: Offset for pagination (default: 0)
 * - start_date: Start date filter (ISO 8601)
 * - end_date: End date filter (ISO 8601)
 * - export: Set to "csv" to export as CSV
 */
export async function GET(req: NextRequest) {
  try {
    const apiKeyHeader = req.headers.get('x-api-key')

    if (!apiKeyHeader) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 })
    }

    const apiKey = await authenticateApiKey(apiKeyHeader)

    const searchParams = req.nextUrl.searchParams
    const projectId = searchParams.get('project_id')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const exportFormat = searchParams.get('export')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Verify the API key has access to the project
    if (apiKey.project_id !== projectId) {
      return NextResponse.json(
        { error: 'API key does not have access to this project' },
        { status: 403 }
      )
    }

    const options: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    } = {}

    if (limit) options.limit = parseInt(limit, 10)
    if (offset) options.offset = parseInt(offset, 10)
    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)

    // Export as CSV
    if (exportFormat === 'csv') {
      const csv = await exportMcpTokenUsageAnalyticsAsCsv(projectId, options)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="mcp-usage-analytics-${projectId}.csv"`,
        },
      })
    }

    // Return JSON
    const analytics = await getMcpTokenUsageAnalytics(projectId, options)

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error: any) {
    console.error('[MCP Analytics API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch MCP usage analytics' },
      { status: 500 }
    )
  }
}

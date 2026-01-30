/**
 * MCP Usage Analytics API
 *
 * US-011: Implement MCP Usage Analytics
 *
 * Provides API endpoints for tracking and viewing MCP token usage analytics.
 * Uses session-based authentication for developer portal access.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getMcpTokenUsageAnalytics, exportMcpTokenUsageAnalyticsAsCsv } from '@/lib/mcp-audit-logger'
import { getPool } from '@/lib/db'

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
    // Authenticate the developer session
    const auth = await authenticateRequest(req)

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

    // Verify the developer has access to the project
    const pool = getPool()
    const projectCheck = await pool.query(
      'SELECT p.id FROM projects p JOIN developers d ON p.tenant_id = d.tenant_id WHERE p.id = $1 AND d.id = $2',
      [projectId, auth.user.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
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
          'Content-Disposition': `attachment; filename="mcp-usage-analytics-${projectId}-${new Date().toISOString().split('T')[0]}.csv"`,
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
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to fetch MCP usage analytics' },
      { status }
    )
  }
}

/**
 * Log Charts API
 *
 * Provides aggregated log data for visualization.
 * Returns time-series data grouped by level and service.
 *
 * US-010: Add Log Charts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

interface ChartDataPoint {
  timestamp: string
  count: number
  level: string
  service?: string
}

interface ChartResponse {
  data: ChartDataPoint[]
  timeRange: {
    start: string
    end: string
  }
  totalLogs: number
  groupBy: 'level' | 'service'
}

/**
 * GET /api/logs/charts
 *
 * Query parameters:
 * - project_id: Project ID (required)
 * - group_by: 'level' or 'service' (default: 'level')
 * - start_date: ISO timestamp (default: 24h ago)
 * - end_date: ISO timestamp (default: now)
 * - interval: Time bucket size in minutes (default: 60)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')
    const groupBy = searchParams.get('group_by') || 'level'
    const intervalMinutes = parseInt(searchParams.get('interval') || '60', 10)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    if (payload.project_id !== projectId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate group_by parameter
    if (groupBy !== 'level' && groupBy !== 'service') {
      return NextResponse.json({ error: 'group_by must be "level" or "service"' }, { status: 400 })
    }

    // Calculate time range
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 24 * 60 * 60 * 1000)

    const pool = getPool()

    // Get log data grouped by time interval and level/service
    const query = `
      WITH time_buckets AS (
        SELECT
          date_trunc('hour', timestamp) AS bucket,
          ${groupBy === 'level' ? 'level' : 'service'} AS group_key,
          COUNT(*) AS count
        FROM control_plane.project_logs
        WHERE project_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
        GROUP BY date_trunc('hour', timestamp), ${groupBy === 'level' ? 'level' : 'service'}
        ORDER BY bucket DESC, group_key
      )
      SELECT
        bucket AS timestamp,
        group_key,
        count
      FROM time_buckets
    `

    const result = await pool.query(query, [projectId, start.toISOString(), end.toISOString()])

    // Transform data for chart
    const data: ChartDataPoint[] = result.rows.map((row) => ({
      timestamp: row.timestamp,
      count: parseInt(row.count, 10),
      level: groupBy === 'level' ? row.group_key : undefined,
      service: groupBy === 'service' ? row.group_key : undefined,
    }))

    // Get total log count
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM control_plane.project_logs
       WHERE project_id = $1 AND timestamp >= $2 AND timestamp <= $3`,
      [projectId, start.toISOString(), end.toISOString()]
    )

    const totalLogs = parseInt(totalResult.rows[0].count, 10)

    const response: ChartResponse = {
      data,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalLogs,
      groupBy: groupBy as 'level' | 'service',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Log Charts API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

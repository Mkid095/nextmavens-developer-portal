/**
 * GET /api/logs/download
 *
 * Download logs for a project as a JSON file.
 * Respects current filters and limits date range to 7 days max.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getPool } from '@/lib/db'

interface LogEntry {
  id: string
  timestamp: string
  service: string
  level: string
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
}

const MAX_DATE_RANGE_DAYS = 7
const MAX_DOWNLOAD_LOGS = 10000

export async function GET(request: NextRequest) {
  try {
    const developer = await authenticateRequest(request)
    const searchParams = request.nextUrl.searchParams

    const projectId = searchParams.get('project_id')
    const service = searchParams.get('service')
    const level = searchParams.get('level')
    const search = searchParams.get('search')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Verify developer owns this project
    const pool = getPool()
    const projectCheck = await pool.query(
      'SELECT id, slug FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate date range with max 7 days
    let start = startDate ? new Date(startDate) : new Date()
    let end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date()

    // Default to last 7 days if no dates provided
    if (!startDate && !endDate) {
      start = new Date(Date.now() - MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000)
    }

    // Enforce max date range
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days` },
        { status: 400 }
      )
    }

    // Build query with filters
    let query = `
      SELECT
        id,
        timestamp,
        service,
        level,
        message,
        metadata,
        request_id
      FROM control_plane.project_logs
      WHERE project_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
    `
    const params: (string | number | Date)[] = [projectId, start.toISOString(), end.toISOString()]
    let paramIndex = 4

    if (service) {
      query += ` AND service = $${paramIndex++}`
      params.push(service)
    }

    if (level) {
      query += ` AND level = $${paramIndex++}`
      params.push(level)
    }

    if (search) {
      query += ` AND (message ILIKE $${paramIndex++} OR request_id ILIKE $${paramIndex++})`
      params.push(`%${search}%`, `%${search}%`)
    }

    // Add ordering and limit
    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++}`
    params.push(MAX_DOWNLOAD_LOGS)

    // Fetch logs
    const result = await pool.query(query, params)

    const logs: LogEntry[] = result.rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      service: row.service,
      level: row.level,
      message: row.message,
      metadata: row.metadata ? JSON.parse(JSON.stringify(row.metadata)) : undefined,
      request_id: row.request_id,
    }))

    // Create JSON file
    const jsonContent = JSON.stringify(logs, null, 2)
    const buffer = Buffer.from(jsonContent, 'utf-8')

    // Set filename
    const projectSlug = projectCheck.rows[0].slug
    const filename = `${projectSlug}-logs-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Logs API] Error downloading logs:', error)
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to download logs. Please try again later.' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

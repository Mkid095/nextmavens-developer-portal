/**
 * GET /api/logs
 *
 * Fetch logs for a project with optional filtering.
 * Supports pagination, filtering by service/level, search, and date range.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getPool } from '@/lib/db'

interface LogEntry {
  id: string
  timestamp: string
  service: 'database' | 'auth' | 'realtime' | 'storage' | 'graphql'
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
}

export async function GET(request: NextRequest) {
  try {
    const developer = await authenticateRequest(request)
    const searchParams = request.nextUrl.searchParams

    const projectId = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
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
    `
    const params: (string | number)[] = [projectId]
    let paramIndex = 2

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

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`
      params.push(new Date(startDate).toISOString())
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`
      params.push(new Date(endDate + 'T23:59:59.999Z').toISOString())
    }

    // Get total count
    const selectIndex = query.toUpperCase().indexOf('SELECT')
    const fromIndex = query.toUpperCase().indexOf('FROM')
    const countQuery = 'SELECT COUNT(*) ' + query.substring(fromIndex)
    const countResult = await pool.query(countQuery, params)
    const total = parseInt(countResult.rows[0].count, 10)

    // Add ordering and pagination
    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

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

    const hasMore = offset + limit < total

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
      has_more: hasMore,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Logs API] Error fetching logs:', error)
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to fetch logs. Please try again later.' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

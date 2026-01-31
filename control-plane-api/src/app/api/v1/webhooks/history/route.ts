import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  listEventLogsQuerySchema,
  type ListEventLogsQuery,
} from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project ownership
async function validateProjectOwnership(
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

// GET /v1/webhooks/history - List webhook delivery history
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

    let query: ListEventLogsQuery = {}
    try {
      query = listEventLogsQuerySchema.parse(queryParams)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Build query with filters
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // If project_id is provided, validate ownership and filter by it
    if (query.project_id) {
      const hasAccess = await validateProjectOwnership(query.project_id, developer)
      if (!hasAccess) {
        return errorResponse('PERMISSION_DENIED', 'You do not have access to this project', 403)
      }
      conditions.push(`el.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    } else {
      // If no project_id filter, only show event logs for user's projects
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    // Filter by webhook_id
    if (query.webhook_id) {
      conditions.push(`el.webhook_id = $${paramIndex++}`)
      values.push(query.webhook_id)
    }

    // Filter by event_type
    if (query.event_type) {
      conditions.push(`el.event_type = $${paramIndex++}`)
      values.push(query.event_type)
    }

    // Filter by status
    if (query.status) {
      conditions.push(`el.status = $${paramIndex++}`)
      values.push(query.status)
    }

    const limit = query.limit
    const offset = query.offset

    values.push(limit, offset)

    // Get event logs with webhook and project details
    const result = await pool.query(
      `SELECT
        el.id, el.project_id, el.webhook_id, el.event_type, el.status,
        el.response_code, el.response_body, el.retry_count, el.delivered_at, el.created_at,
        w.event as webhook_event, w.target_url,
        p.project_name
      FROM control_plane.event_log el
      LEFT JOIN control_plane.webhooks w ON el.webhook_id = w.id
      LEFT JOIN projects p ON el.project_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY el.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
      FROM control_plane.event_log el
      LEFT JOIN projects p ON el.project_id = p.id
      WHERE ${conditions.join(' AND ')}`,
      values.slice(0, -2) // Exclude limit and offset
    )

    const total = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        project_id: row.project_id,
        project_name: row.project_name,
        webhook_id: row.webhook_id,
        event_type: row.event_type,
        status: row.status,
        response_code: row.response_code,
        response_body: row.response_body,
        retry_count: row.retry_count,
        delivered_at: row.delivered_at,
        created_at: row.created_at,
        webhook: row.webhook_id ? {
          id: row.webhook_id,
          event: row.webhook_event,
          target_url: row.target_url,
        } : null,
      })),
      meta: {
        limit,
        offset,
        total,
        has_more: offset + limit < total,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing event logs:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list event logs', 500)
  }
}

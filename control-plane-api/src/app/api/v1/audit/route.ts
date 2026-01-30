import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  listAuditQuerySchema,
  type ListAuditQuery,
} from '@/lib/validation'

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

// GET /v1/audit - Query audit logs with filtering
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

    let query: ListAuditQuery = {}
    try {
      query = listAuditQuerySchema.parse(queryParams)
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

    // If project_id is provided, validate access and filter by it
    if (query.project_id) {
      const hasAccess = await validateProjectAccess(query.project_id, developer)
      if (!hasAccess) {
        return errorResponse('PERMISSION_DENIED', 'You do not have access to this project', 403)
      }
      conditions.push(`al.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    }

    // Filter by actor_id
    if (query.actor_id) {
      conditions.push(`al.actor_id = $${paramIndex++}`)
      values.push(query.actor_id)
    }

    // Filter by actor_type
    if (query.actor_type) {
      conditions.push(`al.actor_type = $${paramIndex++}`)
      values.push(query.actor_type)
    }

    // Filter by action
    if (query.action) {
      conditions.push(`al.action = $${paramIndex++}`)
      values.push(query.action)
    }

    // Filter by target_type
    if (query.target_type) {
      conditions.push(`al.target_type = $${paramIndex++}`)
      values.push(query.target_type)
    }

    // Filter by target_id
    if (query.target_id) {
      conditions.push(`al.target_id = $${paramIndex++}`)
      values.push(query.target_id)
    }

    // Filter by request_id
    if (query.request_id) {
      conditions.push(`al.request_id = $${paramIndex++}`)
      values.push(query.request_id)
    }

    // Filter by date range
    if (query.start_date) {
      conditions.push(`al.created_at >= $${paramIndex++}`)
      values.push(query.start_date)
    }

    if (query.end_date) {
      conditions.push(`al.created_at <= $${paramIndex++}`)
      values.push(query.end_date)
    }

    // If no project filter and no actor_id filter, only show logs for user's projects
    if (!query.project_id && !query.actor_id) {
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    const limit = query.limit
    const offset = query.offset

    values.push(limit, offset)

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM control_plane.audit_logs al
       LEFT JOIN projects p ON al.project_id = p.id
       ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
      values.slice(0, -2) // Exclude limit and offset
    )

    const total = parseInt(countResult.rows[0].total, 10)

    // Query audit logs with actor details
    const result = await pool.query(
      `SELECT
        al.id, al.actor_id, al.actor_type, al.action,
        al.target_type, al.target_id, al.metadata,
        al.ip_address, al.user_agent, al.request_id,
        al.project_id, al.created_at,
        p.project_name,
        d.name as actor_name, d.email as actor_email
      FROM control_plane.audit_logs al
      LEFT JOIN projects p ON al.project_id = p.id
      LEFT JOIN developers d ON al.actor_id = d.id AND al.actor_type = 'user'
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        actor_id: row.actor_id,
        actor_type: row.actor_type,
        action: row.action,
        target_type: row.target_type,
        target_id: row.target_id,
        metadata: row.metadata,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        request_id: row.request_id,
        project_id: row.project_id,
        created_at: row.created_at,
        actor_details: row.actor_type === 'user' ? {
          name: row.actor_name,
          email: row.actor_email,
        } : null,
        project_name: row.project_name,
      })),
      pagination: {
        total,
        limit,
        offset,
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
    console.error('Error listing audit logs:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list audit logs', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  listJobsQuerySchema,
  type ListJobsQuery,
} from '@/lib/validation'
import {
  toErrorNextResponse,
  createError,
  ErrorCode,
} from '@/lib/errors'

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

// GET /v1/jobs - List jobs with filtering
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

    let query: ListJobsQuery = {}
    try {
      query = listJobsQuerySchema.parse(queryParams)
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
      conditions.push(`j.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    } else {
      // If no project_id filter, only show jobs for user's projects
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    if (query.type) {
      conditions.push(`j.type = $${paramIndex++}`)
      values.push(query.type)
    }

    if (query.status) {
      conditions.push(`j.status = $${paramIndex++}`)
      values.push(query.status)
    }

    const limit = query.limit
    const offset = query.offset

    values.push(limit, offset)

    const result = await pool.query(
      `SELECT
        j.id, j.type, j.status, j.attempts, j.max_attempts,
        j.last_error, j.scheduled_at, j.started_at, j.completed_at, j.created_at,
        j.project_id, p.project_name
      FROM jobs j
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(j => ({
        id: j.id,
        type: j.type,
        status: j.status,
        attempts: j.attempts,
        max_attempts: j.max_attempts,
        last_error: j.last_error,
        scheduled_at: j.scheduled_at,
        started_at: j.started_at,
        completed_at: j.completed_at,
        created_at: j.created_at,
        project_id: j.project_id,
        project_name: j.project_name,
      })),
      meta: {
        limit,
        offset,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing jobs:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list jobs', 500)
  }
}

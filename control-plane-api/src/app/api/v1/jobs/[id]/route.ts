import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
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

// GET /v1/jobs/:id - Get job details and status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const jobId = params.id

    // Validate job ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(jobId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid job ID format', 400)
    }

    // Query job with project ownership check
    const result = await pool.query(
      `SELECT
        j.id, j.type, j.status, j.payload, j.attempts, j.max_attempts,
        j.last_error, j.scheduled_at, j.started_at, j.completed_at, j.created_at,
        j.project_id, p.project_name, p.developer_id
      FROM jobs j
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE j.id = $1`,
      [jobId]
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Job not found', 404)
    }

    const job = result.rows[0]

    // Check ownership - user must own the project this job belongs to
    if (job.developer_id !== developer.id) {
      return errorResponse('PERMISSION_DENIED', 'You do not have access to this job', 403)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        status: job.status,
        payload: job.payload,
        attempts: job.attempts,
        max_attempts: job.max_attempts,
        last_error: job.last_error,
        scheduled_at: job.scheduled_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        created_at: job.created_at,
        project_id: job.project_id,
        project_name: job.project_name,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting job details:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get job details', 500)
  }
}

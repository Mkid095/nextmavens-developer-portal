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

// POST /v1/jobs/:id/retry - Retry failed job
export async function POST(
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
    const jobResult = await pool.query(
      `SELECT
        j.id, j.type, j.status, j.attempts, j.max_attempts,
        j.project_id, p.developer_id
      FROM jobs j
      LEFT JOIN projects p ON j.project_id = p.id
      WHERE j.id = $1`,
      [jobId]
    )

    if (jobResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Job not found', 404)
    }

    const job = jobResult.rows[0]

    // Check ownership
    if (job.developer_id !== developer.id) {
      return errorResponse('PERMISSION_DENIED', 'You do not have access to this job', 403)
    }

    // Check if job can be retried (only failed jobs can be retried)
    if (job.status !== 'failed') {
      return errorResponse(
        'VALIDATION_ERROR',
        'Only failed jobs can be retried',
        400
      )
    }

    // Check max_attempts limit
    if (job.attempts >= job.max_attempts) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Job has reached maximum retry attempts',
        400
      )
    }

    // Reset job to pending status and increment attempt count
    const updateResult = await pool.query(
      `UPDATE jobs
       SET status = 'pending',
           attempts = attempts + 1,
           last_error = NULL,
           started_at = NULL,
           completed_at = NULL,
           scheduled_at = NOW()
       WHERE id = $1
       RETURNING id, type, status, attempts, max_attempts, scheduled_at`,
      [jobId]
    )

    const updatedJob = updateResult.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: updatedJob.id,
        type: updatedJob.type,
        status: updatedJob.status,
        attempts: updatedJob.attempts,
        max_attempts: updatedJob.max_attempts,
        scheduled_at: updatedJob.scheduled_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error retrying job:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to retry job', 500)
  }
}

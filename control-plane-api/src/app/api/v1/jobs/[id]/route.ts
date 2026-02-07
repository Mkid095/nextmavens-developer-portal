import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getJob } from '@/features/jobs'
import { createAuditLog } from '@/features/audit'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// GET /v1/jobs/:id - Get a specific job by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const jobId = params.id

    // Get job
    const { success, job, error } = await getJob(jobId)

    if (!success) {
      if (error === 'Job not found') {
        return errorResponse('NOT_FOUND', 'Job not found', 404)
      }
      console.error('[Jobs API] Error getting job:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch job', 500)
    }

    // Check access control
    if (job.project_id) {
      const pool = getPool()
      const projectResult = await pool.query(
        'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
        [job.project_id]
      )

      if (projectResult.rows.length === 0) {
        return errorResponse('NOT_FOUND', 'Associated project not found', 404)
      }

      const project = projectResult.rows[0]

      // Personal project: check if user is the owner
      if (!project.organization_id) {
        if (String(project.developer_id) !== String(developer.id)) {
          return errorResponse('FORBIDDEN', 'You do not have access to this job', 403)
        }
      } else {
        // Organization project: check if user is a member
        const membershipCheck = await pool.query(
          `SELECT 1 FROM control_plane.organization_members
           WHERE org_id = $1 AND user_id = $2 AND status = 'accepted'
           LIMIT 1`,
          [project.organization_id, developer.id]
        )

        if (membershipCheck.rows.length === 0) {
          return errorResponse('FORBIDDEN', 'You do not have access to this job', 403)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        project_id: job.project_id,
        type: job.type,
        status: job.status,
        input_data: job.input_data,
        result_data: job.result_data,
        error_message: job.error_message,
        started_at: job.started_at,
        completed_at: job.completed_at,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Jobs API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch job', 500)
  }
}

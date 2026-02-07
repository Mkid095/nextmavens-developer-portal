import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { listEventLogsQuerySchema, type ListEventLogsQuery } from '@/lib/validation'
import { listEventLogs } from '@/features/webhooks'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project ownership/access
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  const project = result.rows[0]

  // Personal project: check if user is the owner
  if (!project.organization_id) {
    if (String(project.developer_id) !== String(developer.id)) {
      return { valid: false, project }
    }
    return { valid: true, project }
  }

  // Organization project: check if user is a member
  const membershipCheck = await pool.query(
    `SELECT 1 FROM control_plane.organization_members
     WHERE org_id = $1 AND user_id = $2 AND status = 'accepted'
     LIMIT 1`,
    [project.organization_id, developer.id]
  )

  if (membershipCheck.rows.length === 0) {
    return { valid: false, project }
  }

  return { valid: true, project }
}

// GET /v1/webhooks/logs - List webhook event logs (delivery history)
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListEventLogsQuery = {
      limit: 100,
      offset: 0,
    }
    try {
      query = listEventLogsQuerySchema.parse(queryParams)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Validate project ownership if project_id is provided
    if (query.project_id) {
      const validation = await validateProjectOwnership(query.project_id, developer)
      if (!validation.valid) {
        return errorResponse('NOT_FOUND', 'Project not found', 404)
      }
    }

    // List event logs with filters
    const { success, eventLogs, total, error } = await listEventLogs({
      project_id: query.project_id,
      webhook_id: query.webhook_id,
      event_type: query.event_type,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    })

    if (!success) {
      console.error('[Webhooks API] Error listing event logs:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch webhook event logs', 500)
    }

    return NextResponse.json({
      success: true,
      data: {
        event_logs: eventLogs || [],
        total: total || 0,
        limit: query.limit || 100,
        offset: query.offset || 0,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Webhooks API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch webhook event logs', 500)
  }
}

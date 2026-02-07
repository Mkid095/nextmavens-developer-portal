import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { listAuditQuerySchema, type ListAuditQuery } from '@/lib/validation'
import { listAuditLogs } from '@/features/audit'

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

// GET /v1/audit - List audit logs with filters
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListAuditQuery = {
      limit: 100,
      offset: 0,
    }
    try {
      query = listAuditQuerySchema.parse(queryParams)
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

    // Parse date filters
    const filters: any = {
      actor_id: query.actor_id,
      actor_type: query.actor_type,
      action: query.action,
      target_type: query.target_type,
      target_id: query.target_id,
      project_id: query.project_id,
      request_id: query.request_id,
      severity: query.severity,
      limit: query.limit,
      offset: query.offset,
    }

    if (query.start_date) {
      filters.start_date = new Date(query.start_date)
    }

    if (query.end_date) {
      filters.end_date = new Date(query.end_date)
    }

    // List audit logs with filters
    const { success, auditLogs, total, error } = await listAuditLogs(filters)

    if (!success) {
      console.error('[Audit API] Error listing audit logs:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch audit logs', 500)
    }

    return NextResponse.json({
      success: true,
      data: {
        audit_logs: auditLogs || [],
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
    console.error('[Audit API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch audit logs', 500)
  }
}

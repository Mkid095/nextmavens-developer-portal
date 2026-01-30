import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { toErrorNextResponse, ErrorCode, isPlatformError } from '@/lib/errors'

// Helper function to validate ownership
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any; error?: string }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, project_name, tenant_id, status, deletion_scheduled_at, grace_period_ends_at FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false, error: 'NOT_FOUND' }
  }

  const project = result.rows[0]
  if (project.developer_id !== developer.id) {
    return { valid: false, error: 'FORBIDDEN' }
  }

  return { valid: true, project }
}

// POST /v1/projects/:id/restore - Restore a soft-deleted project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const projectId = params.id

    const { valid, project, error } = await validateProjectOwnership(projectId, developer)

    if (!valid) {
      if (error === 'NOT_FOUND') {
        return toErrorNextResponse({ code: ErrorCode.NOT_FOUND, message: 'Project not found' })
      }
      return toErrorNextResponse({ code: ErrorCode.PERMISSION_DENIED, message: 'Access denied' }, projectId)
    }

    const pool = getPool()

    // Check if project is deleted
    if (project.status !== 'DELETED') {
      return toErrorNextResponse({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Project is not deleted and cannot be restored'
      })
    }

    // Check if grace period has not ended
    const now = new Date()
    const gracePeriodEnd = new Date(project.grace_period_ends_at)

    if (gracePeriodEnd < now) {
      return toErrorNextResponse({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Grace period has ended. Project cannot be restored.'
      })
    }

    // Restore the project by clearing deletion columns and setting status back to ACTIVE
    const result = await pool.query(
      `UPDATE projects
       SET deletion_scheduled_at = NULL,
           grace_period_ends_at = NULL,
           status = 'ACTIVE',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, project_name, status`,
      [projectId]
    )

    return NextResponse.json({
      success: true,
      message: 'Project restored successfully',
      project: {
        id: result.rows[0].id,
        name: result.rows[0].project_name,
        status: result.rows[0].status,
      },
    })
  } catch (error) {
    if (isPlatformError(error)) {
      return error.toNextResponse()
    }
    console.error('Error restoring project:', error)
    return toErrorNextResponse(error, params.id)
  }
}

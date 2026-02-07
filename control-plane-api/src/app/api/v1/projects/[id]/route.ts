import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateProjectSchema, type UpdateProjectInput } from '@/lib/validation'
import { toErrorNextResponse, ErrorCode, isPlatformError } from '@/lib/errors'
import { invalidateSnapshot } from '@/lib/snapshot/cache'

// Helper function to validate ownership
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any; error?: string }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, project_name, tenant_id, webhook_url, allowed_origins, rate_limit, status, environment, created_at FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false, error: 'NOT_FOUND' }
  }

  const project = result.rows[0]
  if (String(project.developer_id) !== String(developer.id)) {
    return { valid: false, error: 'FORBIDDEN' }
  }

  return { valid: true, project }
}

// GET /v1/projects/:id - Get project details
export async function GET(
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
    const result = await pool.query(
      `SELECT
        p.id, p.project_name, p.tenant_id, p.webhook_url,
        p.allowed_origins, p.rate_limit, p.status, p.environment, p.created_at,
        t.slug as tenant_slug
      FROM projects p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.id = $1`,
      [projectId]
    )

    const fullProject = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: fullProject.id,
        name: fullProject.project_name,
        slug: fullProject.tenant_slug,
        tenant_id: fullProject.tenant_id,
        environment: fullProject.environment,
        webhook_url: fullProject.webhook_url,
        allowed_origins: fullProject.allowed_origins,
        rate_limit: fullProject.rate_limit,
        status: fullProject.status,
        created_at: fullProject.created_at,
      },
    })
  } catch (error) {
    if (isPlatformError(error)) {
      return error.toNextResponse()
    }
    console.error('Error getting project:', error)
    return toErrorNextResponse(error, params.id)
  }
}

// PUT /v1/projects/:id - Update project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const projectId = params.id
    const body = await req.json()

    // Validate request body
    let validatedData: UpdateProjectInput
    try {
      validatedData = updateProjectSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return toErrorNextResponse(
          { code: ErrorCode.VALIDATION_ERROR, message: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') }
        )
      }
      throw error
    }

    const { valid, project, error } = await validateProjectOwnership(projectId, developer)

    if (!valid) {
      if (error === 'NOT_FOUND') {
        return toErrorNextResponse({ code: ErrorCode.NOT_FOUND, message: 'Project not found' })
      }
      return toErrorNextResponse({ code: ErrorCode.PERMISSION_DENIED, message: 'Access denied' }, projectId)
    }

    const pool = getPool()

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validatedData.project_name !== undefined) {
      updates.push(`project_name = $${paramIndex++}`)
      values.push(validatedData.project_name)
    }

    if (validatedData.webhook_url !== undefined) {
      updates.push(`webhook_url = $${paramIndex++}`)
      values.push(validatedData.webhook_url)
    }

    if (validatedData.allowed_origins !== undefined) {
      updates.push(`allowed_origins = $${paramIndex++}`)
      values.push(validatedData.allowed_origins)
    }

    if (validatedData.rate_limit !== undefined) {
      updates.push(`rate_limit = $${paramIndex++}`)
      values.push(validatedData.rate_limit)
    }

    if (validatedData.environment !== undefined) {
      updates.push(`environment = $${paramIndex++}`)
      values.push(validatedData.environment)
    }

    if (updates.length === 0) {
      return toErrorNextResponse({ code: ErrorCode.VALIDATION_ERROR, message: 'No fields to update' })
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`)
    values.push(projectId)

    const updateResult = await pool.query(
      `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, project_name, tenant_id, webhook_url, allowed_origins, rate_limit, status, environment, updated_at`,
      values
    )

    const updatedProject = updateResult.rows[0]

    // Invalidate snapshot cache so data plane services get updated project state
    invalidateSnapshot(projectId)

    // Get tenant slug for response
    const tenantResult = await pool.query(
      'SELECT slug FROM tenants WHERE id = $1',
      [updatedProject.tenant_id]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProject.id,
        name: updatedProject.project_name,
        slug: tenantResult.rows[0]?.slug,
        tenant_id: updatedProject.tenant_id,
        environment: updatedProject.environment,
        webhook_url: updatedProject.webhook_url,
        allowed_origins: updatedProject.allowed_origins,
        rate_limit: updatedProject.rate_limit,
        status: updatedProject.status,
        updated_at: updatedProject.updated_at,
      },
    })
  } catch (error) {
    if (isPlatformError(error)) {
      return error.toNextResponse()
    }
    console.error('Error updating project:', error)
    return toErrorNextResponse(error, params.id)
  }
}

// DELETE /v1/projects/:id - Soft delete project
export async function DELETE(
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

    // Check if already deleted
    if (project.status === 'DELETED' || project.status === 'archived') {
      return toErrorNextResponse({ code: ErrorCode.VALIDATION_ERROR, message: 'Project is already deleted' })
    }

    // Calculate grace period (30 days from now)
    const now = new Date()
    const gracePeriodEnd = new Date(now)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30)

    // Soft delete by setting deletion_scheduled_at, grace_period_ends_at, and status
    const result = await pool.query(
      `UPDATE projects
       SET deletion_scheduled_at = $1,
           grace_period_ends_at = $2,
           status = 'DELETED',
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, project_name, status`,
      [now, gracePeriodEnd, projectId]
    )

    // Invalidate snapshot cache so data plane services get updated project status
    invalidateSnapshot(projectId)

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        name: result.rows[0].project_name,
        status: result.rows[0].status,
        recoverable_until: gracePeriodEnd.toISOString(),
        message: 'Project has been soft deleted. You can restore it within the grace period.',
      },
    })
  } catch (error) {
    if (isPlatformError(error)) {
      return error.toNextResponse()
    }
    console.error('Error deleting project:', error)
    return toErrorNextResponse(error, params.id)
  }
}


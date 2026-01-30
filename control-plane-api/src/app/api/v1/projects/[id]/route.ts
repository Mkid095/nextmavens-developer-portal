import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateProjectSchema, type UpdateProjectInput } from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

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
  if (project.developer_id !== developer.id) {
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
        return errorResponse('NOT_FOUND', 'Project not found', 404)
      }
      return errorResponse('FORBIDDEN', 'Access denied', 403)
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
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting project:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get project', 500)
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
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    const { valid, project, error } = await validateProjectOwnership(projectId, developer)

    if (!valid) {
      if (error === 'NOT_FOUND') {
        return errorResponse('NOT_FOUND', 'Project not found', 404)
      }
      return errorResponse('FORBIDDEN', 'Access denied', 403)
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
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400)
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
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error updating project:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update project', 500)
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
        return errorResponse('NOT_FOUND', 'Project not found', 404)
      }
      return errorResponse('FORBIDDEN', 'Access denied', 403)
    }

    const pool = getPool()

    // Soft delete by setting status to 'archived'
    await pool.query(
      `UPDATE projects
       SET status = 'archived', updated_at = NOW()
       WHERE id = $1`,
      [projectId]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: projectId,
        message: 'Project archived successfully',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error deleting project:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete project', 500)
  }
}

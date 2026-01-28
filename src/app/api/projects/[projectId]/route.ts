import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { logProjectAction, userActor } from '@nextmavens/audit-logs-database'

/**
 * GET /api/projects/[projectId]
 * Get a single project with suspension status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    const pool = getPool()

    // Get project with tenant info
    const projectResult = await pool.query(
      `SELECT
         p.id, p.project_name, p.tenant_id, p.webhook_url,
         p.allowed_origins, p.rate_limit, p.status, p.created_at,
         t.slug as tenant_slug
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.id = $1 AND p.developer_id = $2`,
      [projectId, developer.id]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]

    // Get suspension status
    const suspension = await SuspensionManager.getStatus(projectId)

    // Build response
    const response: any = {
      id: project.id,
      name: project.project_name,
      slug: project.tenant_slug,
      tenant_id: project.tenant_id,
      status: project.status,
      webhook_url: project.webhook_url,
      allowed_origins: project.allowed_origins,
      rate_limit: project.rate_limit,
      created_at: project.created_at,
    }

    // Add suspension information if suspended
    if (suspension) {
      response.suspension = {
        suspended: true,
        cap_exceeded: suspension.cap_exceeded,
        reason: suspension.reason,
        suspended_at: suspension.suspended_at,
        notes: suspension.notes,
      }
    } else {
      response.suspension = {
        suspended: false,
      }
    }

    return NextResponse.json({ project: response })
  } catch (error: any) {
    console.error('[Projects API] Get project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * PATCH /api/projects/[projectId]
 * Update a project (checks if suspended)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    const pool = getPool()

    // Verify project ownership
    const projectResult = await pool.query(
      'SELECT id, developer_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]
    if (project.developer_id !== developer.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if project is suspended
    const suspension = await SuspensionManager.getStatus(projectId)
    if (suspension) {
      return NextResponse.json(
        {
          error: 'Project is suspended',
          message: `Cannot modify suspended project. Project exceeded ${suspension.cap_exceeded} limit.`,
          suspension: {
            cap_exceeded: suspension.cap_exceeded,
            reason: suspension.reason,
            suspended_at: suspension.suspended_at,
          },
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { webhook_url, allowed_origins, rate_limit } = body

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (webhook_url !== undefined) {
      updates.push(`webhook_url = $${paramIndex++}`)
      values.push(webhook_url)
    }

    if (allowed_origins !== undefined) {
      updates.push(`allowed_origins = $${paramIndex++}`)
      values.push(allowed_origins)
    }

    if (rate_limit !== undefined) {
      updates.push(`rate_limit = $${paramIndex++}`)
      values.push(rate_limit)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`)
    values.push(projectId)

    const updateResult = await pool.query(
      `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, project_name, tenant_id, webhook_url, allowed_origins, rate_limit, updated_at`,
      values
    )

    const updatedProject = updateResult.rows[0]

    // Log project update
    await logProjectAction.updated(
      userActor(developer.id),
      projectId,
      {
        webhook_url: webhook_url !== undefined ? webhook_url : updatedProject.webhook_url,
        allowed_origins: allowed_origins !== undefined ? allowed_origins : updatedProject.allowed_origins,
        rate_limit: rate_limit !== undefined ? rate_limit : updatedProject.rate_limit,
      },
      {
        request: {
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      }
    )

    return NextResponse.json({
      message: 'Project updated successfully',
      project: {
        id: updatedProject.id,
        name: updatedProject.project_name,
        tenant_id: updatedProject.tenant_id,
        webhook_url: updatedProject.webhook_url,
        allowed_origins: updatedProject.allowed_origins,
        rate_limit: updatedProject.rate_limit,
        updated_at: updatedProject.updated_at,
      },
    })
  } catch (error: any) {
    console.error('[Projects API] Update project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete a project (checks if suspended)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    const pool = getPool()

    // Verify project ownership
    const projectResult = await pool.query(
      'SELECT id, developer_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]
    if (project.developer_id !== developer.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if project is suspended
    const suspension = await SuspensionManager.getStatus(projectId)
    if (suspension) {
      return NextResponse.json(
        {
          error: 'Project is suspended',
          message: `Cannot delete suspended project. Please contact support to resolve the suspension first.`,
          suspension: {
            cap_exceeded: suspension.cap_exceeded,
            reason: suspension.reason,
            suspended_at: suspension.suspended_at,
          },
        },
        { status: 403 }
      )
    }

    // Delete project (cascade will handle related records)
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId])

    // Log project deletion
    await logProjectAction.deleted(
      userActor(developer.id),
      projectId,
      {
        metadata: {
          project_name: project.project_name,
        },
        request: {
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      }
    )

    return NextResponse.json({
      message: 'Project deleted successfully',
      project_id: projectId,
    })
  } catch (error: any) {
    console.error('[Projects API] Delete project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

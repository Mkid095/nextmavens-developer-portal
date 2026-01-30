import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { logProjectAction, userActor } from '@nextmavens/audit-logs-database'
import { ProjectLifecycleStatus, isValidTransition } from '@/features/project-lifecycle/types/project-status.types'

/**
 * POST /api/projects/[projectId]/activate
 * Activate a project (transition from CREATED to ACTIVE)
 *
 * PRD: US-003 from prd-project-lifecycle.json
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    const pool = getPool()

    // Verify project ownership and get current status
    const projectResult = await pool.query(
      `SELECT id, developer_id, project_name, status
       FROM projects
       WHERE id = $1`,
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

    const currentStatus = project.status as ProjectLifecycleStatus

    // Validate state transition
    // Only CREATED projects can be activated
    if (currentStatus === ProjectLifecycleStatus.ACTIVE) {
      return NextResponse.json(
        {
          error: 'Project is already active',
          message: 'This project is already in the ACTIVE state.',
          project: {
            id: project.id,
            name: project.project_name,
            status: currentStatus,
          },
        },
        { status: 409 }
      )
    }

    if (!isValidTransition(currentStatus, ProjectLifecycleStatus.ACTIVE)) {
      return NextResponse.json(
        {
          error: 'Invalid state transition',
          message: `Cannot activate project from ${currentStatus.toUpperCase()} state. Project must be in CREATED state to activate.`,
          current_status: currentStatus,
          valid_transitions: ['created'],
        },
        { status: 400 }
      )
    }

    // Update project status to ACTIVE
    const updateResult = await pool.query(
      `UPDATE projects
       SET status = 'active', updated_at = NOW()
       WHERE id = $1
       RETURNING id, project_name, tenant_id, status, webhook_url, allowed_origins, rate_limit, created_at, updated_at`,
      [projectId]
    )

    const activatedProject = updateResult.rows[0]

    // Log project activation
    await logProjectAction.updated(
      userActor(developer.id),
      projectId,
      {
        action: 'activated',
        previous_status: currentStatus,
        new_status: 'active',
      },
      {
        request: {
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      }
    )

    // TODO: Send confirmation email
    // This requires email service integration
    // For now, we log it as a pending task

    const res = NextResponse.json(
      {
        message: 'Project activated successfully',
        project: {
          id: activatedProject.id,
          name: activatedProject.project_name,
          tenant_id: activatedProject.tenant_id,
          status: activatedProject.status,
          webhook_url: activatedProject.webhook_url,
          allowed_origins: activatedProject.allowed_origins,
          rate_limit: activatedProject.rate_limit,
          created_at: activatedProject.created_at,
          updated_at: activatedProject.updated_at,
        },
      },
      { status: 200 }
    )
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Projects API] Activate project error:', error)

    const statusCode = error.message === 'No token provided' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to activate project' },
      { status: statusCode }
    )
  }
}

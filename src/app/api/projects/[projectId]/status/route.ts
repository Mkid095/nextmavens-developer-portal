import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { logProjectAction, userActor } from '@nextmavens/audit-logs-database'
import {
  ProjectLifecycleStatus,
  isValidTransition,
  ProjectStatusError,
  VALID_TRANSITIONS,
} from '@/features/project-lifecycle/types/project-status.types'

/**
 * PUT /api/projects/[projectId]/status
 * Generic endpoint to change project status
 *
 * This endpoint provides a unified interface for changing project status,
 * validating state transitions, and logging all status changes.
 *
 * PRD: US-006 from prd-project-lifecycle.json
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Parse and validate request body
    let body: { new_status?: string; reason?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      )
    }

    // Validate new_status parameter
    if (!body.new_status || typeof body.new_status !== 'string') {
      return NextResponse.json(
        {
          error: 'Missing required parameter',
          message: 'new_status is required. Must be one of: active, suspended, archived, deleted',
        },
        { status: 400 }
      )
    }

    const newStatusStr = body.new_status.toLowerCase().trim()

    // Validate that new_status is a valid ProjectLifecycleStatus
    const validStatuses = Object.values(ProjectLifecycleStatus)
    if (!validStatuses.includes(newStatusStr as ProjectLifecycleStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid status',
          message: `Invalid status: "${newStatusStr}". Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const newStatus = newStatusStr as ProjectLifecycleStatus

    // Validate reason parameter (required for certain transitions)
    const transitionsRequiringReason: ProjectLifecycleStatus[] = [
      ProjectLifecycleStatus.SUSPENDED,
      ProjectLifecycleStatus.DELETED,
    ]

    if (transitionsRequiringReason.includes(newStatus)) {
      if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Missing required parameter',
            message: `A reason is required to change project status to ${newStatus.toUpperCase()}. Please provide context for this status change.`,
          },
          { status: 400 }
        )
      }
    }

    const reason = body.reason?.trim() || ''

    // Validate reason length if provided
    if (reason.length > 1000) {
      return NextResponse.json(
        {
          error: 'Invalid parameter',
          message: 'Reason must be less than 1000 characters',
        },
        { status: 400 }
      )
    }

    const pool = getPool()

    // Verify project ownership and get current status
    const projectResult = await pool.query(
      `SELECT id, developer_id, project_name, status, tenant_id, webhook_url, allowed_origins, rate_limit, created_at
       FROM projects
       WHERE id = $1`,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found', message: 'The specified project does not exist' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]

    // Check ownership - only project owner can change status
    if (project.developer_id !== developer.id) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to change this project\'s status',
        },
        { status: 403 }
      )
    }

    const currentStatus = project.status as ProjectLifecycleStatus

    // Check if already in target state
    if (currentStatus === newStatus) {
      return NextResponse.json(
        {
          error: 'Project already in target state',
          message: `This project is already in the ${newStatus.toUpperCase()} state.`,
          project: {
            id: project.id,
            name: project.project_name,
            status: currentStatus,
          },
        },
        { status: 409 }
      )
    }

    // Validate state transition
    if (!isValidTransition(currentStatus, newStatus)) {
      const validTargets = VALID_TRANSITIONS[currentStatus] || []
      return NextResponse.json(
        {
          error: ProjectStatusError.INVALID_TRANSITION,
          message: `Cannot transition from ${currentStatus.toUpperCase()} to ${newStatus.toUpperCase()}.`,
          current_status: currentStatus,
          requested_status: newStatus,
          valid_transitions: validTargets,
        },
        { status: 400 }
      )
    }

    // Update project status
    const updateResult = await pool.query(
      `UPDATE projects
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_name, tenant_id, status, webhook_url, allowed_origins, rate_limit, created_at, updated_at`,
      [newStatus, projectId]
    )

    const updatedProject = updateResult.rows[0]

    // Log status change to audit
    await logProjectAction.updated(
      userActor(developer.id),
      projectId,
      {
        action: `status_changed_to_${newStatus}`,
        previous_status: currentStatus,
        new_status: newStatus,
        reason: reason || undefined,
      },
      {
        request: {
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      }
    )

    // Build response with status details
    const response: any = {
      message: `Project status changed from ${currentStatus.toUpperCase()} to ${newStatus.toUpperCase()}`,
      project: {
        id: updatedProject.id,
        name: updatedProject.project_name,
        tenant_id: updatedProject.tenant_id,
        status: updatedProject.status,
        webhook_url: updatedProject.webhook_url,
        allowed_origins: updatedProject.allowed_origins,
        rate_limit: updatedProject.rate_limit,
        created_at: updatedProject.created_at,
        updated_at: updatedProject.updated_at,
      },
      status_change: {
        previous_status: currentStatus,
        new_status: newStatus,
        changed_at: updatedProject.updated_at,
      },
    }

    // Add state behavior details to response
    switch (newStatus) {
      case ProjectLifecycleStatus.SUSPENDED:
        response.status_change.details = {
          keys_disabled: true,
          services_disabled: true,
          data_access: 'readonly',
          reason: reason,
        }
        break
      case ProjectLifecycleStatus.ARCHIVED:
        response.status_change.details = {
          keys_disabled: true,
          services_disabled: true,
          data_access: 'readonly',
        }
        break
      case ProjectLifecycleStatus.DELETED:
        response.status_change.details = {
          keys_disabled: true,
          services_disabled: true,
          data_access: 'none',
          reason: reason,
        }
        break
      case ProjectLifecycleStatus.ACTIVE:
        response.status_change.details = {
          keys_enabled: true,
          services_enabled: true,
          data_access: 'full',
        }
        break
    }

    const res = NextResponse.json(response, { status: 200 })
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Projects API] Change project status error:', error)

    const statusCode = error.message === 'No token provided' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to change project status' },
      { status: statusCode }
    )
  }
}

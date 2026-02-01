import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requirePermission } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { logProjectAction, userActor } from '@nextmavenspacks/audit-logs-database'
import {
  ProjectLifecycleStatus,
  isValidTransition,
  ProjectStatusError,
} from '@/features/project-lifecycle/types/project-status.types'
import { Permission } from '@/lib/types/rbac.types'
import { User } from '@/lib/rbac'

/**
 * POST /api/projects/[projectId]/suspend
 * Suspend a project (transition from ACTIVE to SUSPENDED)
 *
 * This endpoint is used to temporarily disable a project due to:
 * - Abuse detection
 * - Quota/hard cap violations
 * - Manual administrative action
 *
 * PRD: US-004 from prd-project-lifecycle.json
 * PRD: US-006 from prd-rbac-system.json (permission check)
 */
export const POST = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_SERVICES,
    getOrganizationId: async (req: NextRequest) => {
      // Extract project ID from URL
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const projectIdIndex = pathParts.indexOf('projects') + 1
      const projectId = pathParts[projectIdIndex]

      // Get project to extract tenant_id (organization ID)
      const pool = getPool()
      const result = await pool.query(
        'SELECT tenant_id FROM projects WHERE id = $1',
        [projectId]
      )

      if (result.rows.length === 0) {
        throw new Error('Project not found')
      }

      return result.rows[0].tenant_id
    }
  },
  async (req: NextRequest, user: User) => {
    // Apply correlation ID to request
    const correlationId = withCorrelationId(req)

    try {
      const projectId = new URL(req.url).pathname.split('/').indexOf('projects') + 1
      const fullProjectId = new URL(req.url).pathname.split('/')[projectId]

      // Parse and validate request body
      let body: { reason?: string }
      try {
        body = await req.json()
      } catch {
        return NextResponse.json(
          { error: 'Invalid request body', message: 'Request body must be valid JSON' },
          { status: 400 }
        )
      }

      // Reason parameter is required for suspension
      if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Missing required parameter',
            message: 'A reason is required to suspend a project. Please provide context for why this project is being suspended.',
          },
          { status: 400 }
        )
      }

      const reason = body.reason.trim()

      // Validate reason length (prevent unreasonably long reasons)
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
        `SELECT id, developer_id, project_name, status, tenant_id
         FROM projects
         WHERE id = $1`,
        [fullProjectId]
      )

      if (projectResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Project not found', message: 'The specified project does not exist' },
          { status: 404 }
        )
      }

      const project = projectResult.rows[0]
      const currentStatus = project.status as ProjectLifecycleStatus

      // Check if project is already suspended
      if (currentStatus === ProjectLifecycleStatus.SUSPENDED) {
        return NextResponse.json(
          {
            error: 'Project already suspended',
            message: 'This project is already in the SUSPENDED state.',
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
      // Only ACTIVE projects can be suspended (via this endpoint)
      if (!isValidTransition(currentStatus, ProjectLifecycleStatus.SUSPENDED)) {
        return NextResponse.json(
          {
            error: ProjectStatusError.INVALID_TRANSITION,
            message: `Cannot suspend project from ${currentStatus.toUpperCase()} state. Only ACTIVE projects can be suspended.`,
            current_status: currentStatus,
            valid_transitions: ['ACTIVE'],
          },
          { status: 400 }
        )
      }

      // Update project status to SUSPENDED
      const updateResult = await pool.query(
        `UPDATE projects
         SET status = 'suspended',
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, project_name, tenant_id, status, webhook_url, allowed_origins, rate_limit, created_at, updated_at`,
        [fullProjectId]
      )

      const suspendedProject = updateResult.rows[0]

      // Log project suspension
      await logProjectAction.updated(
        userActor(user.id),
        fullProjectId,
        {
          action: 'suspended',
          previous_status: currentStatus,
          new_status: 'suspended',
          reason: reason,
        },
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
        }
      )

      // TODO: Send notification email to project owner
      // This requires email service integration
      // For now, we log it as a pending task
      console.log(`[TODO] Send suspension notification email for project ${fullProjectId}. Reason: ${reason}`)

      const res = NextResponse.json(
        {
          message: 'Project suspended successfully',
          project: {
            id: suspendedProject.id,
            name: suspendedProject.project_name,
            tenant_id: suspendedProject.tenant_id,
            status: suspendedProject.status,
            webhook_url: suspendedProject.webhook_url,
            allowed_origins: suspendedProject.allowed_origins,
            rate_limit: suspendedProject.rate_limit,
            created_at: suspendedProject.created_at,
            updated_at: suspendedProject.updated_at,
          },
          suspension_details: {
            reason: reason,
            suspended_at: suspendedProject.updated_at,
            // Keys will return PROJECT_SUSPENDED error when used
            keys_disabled: true,
            services_disabled: true,
            data_access: 'readonly',
          },
        },
        { status: 200 }
      )

      return setCorrelationHeader(res, correlationId)
    } catch (error: any) {
      console.error('[Projects API] Suspend project error:', error)

      const statusCode = error.message === 'No token provided' ? 401 : 500
      return NextResponse.json(
        { error: error.message || 'Failed to suspend project' },
        { status: statusCode }
      )
    }
  }
)

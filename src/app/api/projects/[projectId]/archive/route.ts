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
 * POST /api/projects/[projectId]/archive
 * Archive a project (transition from ACTIVE or SUSPENDED to ARCHIVED)
 *
 * This endpoint is used to permanently archive inactive projects:
 * - Disables all services
 * - API keys stop working
 * - Data remains readable (read-only access)
 * - Typically irreversible without admin intervention
 *
 * PRD: US-005 from prd-project-lifecycle.json
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
      // Extract project ID from URL
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const projectIdIndex = pathParts.indexOf('projects') + 1
      const projectId = pathParts[projectIdIndex]

      const pool = getPool()

      // Verify project ownership and get current status
      const projectResult = await pool.query(
        `SELECT id, developer_id, project_name, status, tenant_id
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
      const currentStatus = project.status as ProjectLifecycleStatus

      // Check if project is already archived
      if (currentStatus === ProjectLifecycleStatus.ARCHIVED) {
        return NextResponse.json(
          {
            error: 'Project already archived',
            message: 'This project is already in the ARCHIVED state.',
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
      // Only ACTIVE and SUSPENDED projects can be archived
      if (!isValidTransition(currentStatus, ProjectLifecycleStatus.ARCHIVED)) {
        return NextResponse.json(
          {
            error: ProjectStatusError.INVALID_TRANSITION,
            message: `Cannot archive project from ${currentStatus.toUpperCase()} state. Only ACTIVE or SUSPENDED projects can be archived.`,
            current_status: currentStatus,
            valid_transitions: ['ACTIVE', 'SUSPENDED'],
          },
          { status: 400 }
        )
      }

      // Update project status to ARCHIVED
      const updateResult = await pool.query(
        `UPDATE projects
         SET status = 'archived',
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, project_name, tenant_id, status, webhook_url, allowed_origins, rate_limit, created_at, updated_at`,
        [projectId]
      )

      const archivedProject = updateResult.rows[0]

      // Log project archival
      await logProjectAction.updated(
        userActor(user.id),
        projectId,
        {
          action: 'archived',
          previous_status: currentStatus,
          new_status: 'archived',
        },
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
        }
      )

      const res = NextResponse.json(
        {
          message: 'Project archived successfully',
          project: {
            id: archivedProject.id,
            name: archivedProject.project_name,
            tenant_id: archivedProject.tenant_id,
            status: archivedProject.status,
            webhook_url: archivedProject.webhook_url,
            allowed_origins: archivedProject.allowed_origins,
            rate_limit: archivedProject.rate_limit,
            created_at: archivedProject.created_at,
            updated_at: archivedProject.updated_at,
          },
          archival_details: {
            archived_at: archivedProject.updated_at,
            // Keys will return PROJECT_ARCHIVED error when used
            keys_disabled: true,
            services_disabled: true,
            data_access: 'readonly',
          },
        },
        { status: 200 }
      )

      return setCorrelationHeader(res, correlationId)
    } catch (error: any) {
      console.error('[Projects API] Archive project error:', error)

      const statusCode = error.message === 'No token provided' ? 401 : 500
      return NextResponse.json(
        { error: error.message || 'Failed to archive project' },
        { status: statusCode }
      )
    }
  }
)

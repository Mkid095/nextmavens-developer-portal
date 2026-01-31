import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { ProjectLifecycleStatus } from '@/features/project-lifecycle/types/project-status.types'

/**
 * Status change history entry interface
 */
interface StatusHistoryEntry {
  id: string
  action: string
  previous_status: string | null
  new_status: string
  reason: string | null
  actor_id: string
  actor_type: string
  created_at: string
}

/**
 * GET /api/projects/[projectId]/status-history
 *
 * Returns the status change history for a project.
 * Retrieves entries from the audit_logs table where the action indicates a status change.
 *
 * PRD: US-009 - Show Status Change History
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const correlationId = withCorrelationId(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Validate project ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        {
          error: 'Invalid project ID',
          message: 'Project ID must be a valid UUID',
        },
        { status: 400 }
      )
    }

    const pool = getPool()

    // Verify project belongs to the developer
    const projectResult = await pool.query(
      'SELECT id, developer_id, project_name, status FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found', message: 'The specified project does not exist' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]
    if (project.developer_id !== developer.id) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to view this project\'s status history',
        },
        { status: 403 }
      )
    }

    // Query audit logs for status change actions
    // Status changes are logged with action pattern: status_changed_to_{status}
    const query = `
      SELECT
        id,
        action,
        actor_id,
        actor_type,
        metadata,
        created_at
      FROM control_plane.audit_logs
      WHERE project_id = $1
        AND action LIKE 'status_changed_to_%'
      ORDER BY created_at DESC
      LIMIT 100
    `

    const result = await pool.query(query, [projectId])

    // Transform audit log entries into status history entries
    const history: StatusHistoryEntry[] = result.rows.map((row) => {
      const metadata = row.metadata || {}
      return {
        id: row.id,
        action: row.action,
        previous_status: metadata.previous_status || null,
        new_status: metadata.new_status || null,
        reason: metadata.reason || null,
        actor_id: row.actor_id,
        actor_type: row.actor_type,
        created_at: row.created_at,
      }
    })

    // Get actor information (user names) for each entry
    const actorIds = [...new Set(history.map((entry) => entry.actor_id))]
    const actorsMap = new Map<string, { name: string | null; email: string | null }>()

    if (actorIds.length > 0) {
      const actorsQuery = `
        SELECT id, name, email
        FROM developers
        WHERE id = ANY($1)
      `
      const actorsResult = await pool.query(actorsQuery, [actorIds])

      for (const actor of actorsResult.rows) {
        actorsMap.set(actor.id, {
          name: actor.name,
          email: actor.email,
        })
      }
    }

    // Enrich history entries with actor information
    const enrichedHistory = history.map((entry) => {
      const actor = actorsMap.get(entry.actor_id)
      return {
        ...entry,
        actor_name: actor?.name || null,
        actor_email: actor?.email || null,
      }
    })

    // Determine resolution steps for current status
    let resolutionSteps: string[] = []
    const currentStatus = project.status as ProjectLifecycleStatus

    switch (currentStatus) {
      case ProjectLifecycleStatus.SUSPENDED:
        resolutionSteps = [
          'Review the reason for suspension below',
          'If due to quota limits, consider upgrading your plan',
          'Contact support if you believe this is an error',
          'Request review using the button below',
        ]
        break
      case ProjectLifecycleStatus.ARCHIVED:
        resolutionSteps = [
          'Archived projects have all services disabled',
          'Data remains accessible in read-only mode',
          'Reactivate the project to restore full access',
        ]
        break
      case ProjectLifecycleStatus.DELETED:
        resolutionSteps = [
          'Deleted projects are scheduled for permanent removal',
          'Data will be permanently deleted after the grace period',
          'Contact support immediately if this was a mistake',
        ]
        break
      default:
        resolutionSteps = []
    }

    const response = {
      project: {
        id: project.id,
        name: project.project_name,
        status: project.status,
      },
      history: enrichedHistory,
      total_entries: enrichedHistory.length,
      resolution_steps: resolutionSteps,
    }

    const res = NextResponse.json(response, { status: 200 })
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Status History API] Get status history error:', error)

    const statusCode = error.message === 'No token provided' ? 401 : 500
    return NextResponse.json(
      {
        error: error.message || 'Failed to get status history',
        message: 'An error occurred while retrieving the status change history',
      },
      { status: statusCode }
    )
  }
}

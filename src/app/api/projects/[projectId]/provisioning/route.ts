import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { getAllSteps, calculateProgress } from '@/lib/provisioning/state-machine'
import type { ProvisioningStep } from '@/features/provisioning/types/provisioning.types'

/**
 * GET /api/projects/[projectId]/provisioning
 *
 * Fetches provisioning progress for a project.
 * Returns all provisioning steps with their status, errors, and overall progress.
 *
 * Story: US-006 - Create Provisioning Progress API
 * PRD: Provisioning State Machine
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const correlationId = withCorrelationId(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    const pool = getPool()

    // Verify project ownership
    const projectResult = await pool.query(
      `SELECT id, developer_id, project_name, status
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

    // Check ownership
    if (project.developer_id !== developer.id) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to view this project\'s provisioning status',
        },
        { status: 403 }
      )
    }

    // Fetch all provisioning steps for this project
    const steps = await getAllSteps(pool, projectId)

    // Calculate overall progress
    const progress = calculateProgress(steps)

    // Build response with step details
    const response = {
      project_id: projectId,
      project_name: project.project_name,
      progress,
      steps: steps.map((step: ProvisioningStep) => ({
        step_name: step.step_name,
        status: step.status,
        started_at: step.started_at,
        completed_at: step.completed_at,
        error_message: step.error_message,
        error_details: step.error_details,
        retry_count: step.retry_count,
        created_at: step.created_at,
      })),
    }

    const res = NextResponse.json(response, { status: 200 })
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Provisioning API] Get provisioning progress error:', error)

    const statusCode = error.message === 'No token provided' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to fetch provisioning progress' },
      { status: statusCode }
    )
  }
}

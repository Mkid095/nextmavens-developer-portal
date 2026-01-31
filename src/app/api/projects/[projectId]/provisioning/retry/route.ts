import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { retryProvisioningStep } from '@/lib/provisioning/state-machine'

/**
 * POST /api/projects/[projectId]/provisioning/retry
 *
 * Retries a failed provisioning step.
 *
 * Story: US-004 - Implement Step Retry Logic
 * PRD: Provisioning State Machine
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const correlationId = withCorrelationId(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Parse request body
    const body = await req.json()
    const { step_name } = body

    if (!step_name || typeof step_name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'step_name is required' },
        { status: 400 }
      )
    }

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
          message: 'You do not have permission to retry provisioning steps for this project',
        },
        { status: 403 }
      )
    }

    // Retry the provisioning step
    const retryResult = await retryProvisioningStep(projectId, step_name, pool)

    // Build response
    const response = {
      success: retryResult.success,
      step_name,
      status: retryResult.status,
      error: retryResult.error,
      retry_count: retryResult.retryCount,
      max_retries_exceeded: retryResult.maxRetriesExceeded,
    }

    const statusCode = retryResult.success ? 200 : 400
    const res = NextResponse.json(response, { status: statusCode })
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Provisioning API] Retry step error:', error)

    const statusCode = error.message === 'No token provided' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to retry provisioning step' },
      { status: statusCode }
    )
  }
}

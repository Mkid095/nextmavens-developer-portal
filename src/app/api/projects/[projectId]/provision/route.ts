import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { PROVISIONING_STEPS, getOrderedStepNames } from '@/lib/provisioning/steps'
import { runProvisioningStep } from '@/lib/provisioning/state-machine'
import type { ProvisioningStepStatus } from '@/features/provisioning/types/provisioning.types'
import { randomUUID } from 'crypto'

/**
 * POST /api/projects/[projectId]/provision
 *
 * Initiates provisioning for a project using the state machine.
 * Creates all provisioning steps as PENDING, runs them in order,
 * and returns a job ID for tracking.
 *
 * Story: US-010 - Update Provisioning API
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
          message: 'You do not have permission to provision this project',
        },
        { status: 403 }
      )
    }

    // Check if provisioning is already in progress or complete
    const existingSteps = await pool.query(
      `SELECT COUNT(*) as count
       FROM provisioning_steps
       WHERE project_id = $1`,
      [projectId]
    )

    if (parseInt(existingSteps.rows[0].count) > 0) {
      // Return existing job info instead of creating duplicate
      return NextResponse.json(
        {
          message: 'Provisioning already initiated',
          project_id: projectId,
          job_id: projectId, // Use project_id as job_id for tracking
        },
        { status: 200 }
      )
    }

    // Generate job ID for tracking
    const jobId = randomUUID()

    // Create all provisioning steps as PENDING in order
    const orderedStepNames = getOrderedStepNames()
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      for (const stepName of orderedStepNames) {
        await client.query(
          `INSERT INTO provisioning_steps (project_id, step_name, status)
           VALUES ($1, $2, $3)`,
          [projectId, stepName, 'pending' as ProvisioningStepStatus]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    // Start running steps in order (don't await - run in background)
    // For simplicity in this implementation, we'll run them sequentially
    // In production, this would use a proper job queue
    runProvisioningStepsAsync(projectId, pool).catch((error) => {
      console.error('[Provisioning API] Background provisioning error:', error)
    })

    const response = {
      message: 'Provisioning initiated',
      project_id: projectId,
      job_id: jobId,
      steps: orderedStepNames.map((stepName) => {
        const step = PROVISIONING_STEPS.find((s) => s.name === stepName)
        return {
          step_name: stepName,
          description: step?.description || '',
          estimated_duration: step?.estimatedDuration || 0,
          status: 'pending' as ProvisioningStepStatus,
        }
      }),
    }

    const res = NextResponse.json(response, { status: 201 })
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Provisioning API] Start provisioning error:', error)

    const statusCode = error.message === 'No token provided' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to start provisioning' },
      { status: statusCode }
    )
  }
}

/**
 * Run provisioning steps in order asynchronously.
 *
 * This function runs all provisioning steps sequentially in the background.
 * It starts each step and waits for completion before starting the next.
 * If a step fails, subsequent steps are still attempted to allow for
 * partial recovery and manual intervention.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 */
async function runProvisioningStepsAsync(
  projectId: string,
  pool: import ('pg').Pool
): Promise<void> {
  const orderedStepNames = getOrderedStepNames()

  for (const stepName of orderedStepNames) {
    try {
      const result = await runProvisioningStep(projectId, stepName, pool)

      if (!result.success) {
        console.error(
          `[Provisioning API] Step ${stepName} failed:`,
          result.error,
          result.errorDetails
        )
        // Continue to next step even if this one failed
        // This allows for partial recovery and manual retry
      } else {
        console.log(`[Provisioning API] Step ${stepName} completed successfully`)
      }
    } catch (error) {
      console.error(`[Provisioning API] Error running step ${stepName}:`, error)
      // Continue to next step
    }
  }
}

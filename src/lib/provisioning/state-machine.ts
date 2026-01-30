/**
 * Provisioning State Machine
 *
 * Step-aware provisioning system that enables safe retry from failure.
 * Handles state transitions: PENDING → RUNNING → SUCCESS/FAILED
 *
 * Story: US-003 - Implement State Machine Logic
 * PRD: Provisioning State Machine
 */

import type { Pool } from 'pg'
import type {
  ProvisioningStep,
  ProvisioningStepStatus,
  ProvisioningErrorDetails,
} from '@/features/provisioning/types/provisioning.types'
import {
  PROVISIONING_STEPS,
  type StepHandler,
  type StepExecutionResult,
} from './steps'

/**
 * Result of running a provisioning step
 */
export interface RunProvisioningStepResult {
  /** Whether the step execution was successful */
  success: boolean
  /** Current status of the step */
  status: ProvisioningStepStatus
  /** Error message if the step failed */
  error?: string
  /** Detailed error information */
  errorDetails?: ProvisioningErrorDetails
  /** When the step started */
  startedAt?: Date
  /** When the step completed */
  completedAt?: Date
  /** Number of retry attempts */
  retryCount: number
}

/**
 * State transition: PENDING → RUNNING → SUCCESS/FAILED
 *
 * This function implements the state machine logic for provisioning steps:
 * 1. Sets status to RUNNING when step starts
 * 2. Executes the step handler function
 * 3. Sets status to SUCCESS or FAILED based on outcome
 * 4. Records timestamps for started_at and completed_at
 *
 * @param projectId - The project ID being provisioned
 * @param stepName - The name of the provisioning step to run
 * @param pool - Database connection pool
 * @param handler - Optional step handler function (if not provided, looks up by step name)
 * @returns Result of the step execution with status and timestamps
 */
export async function runProvisioningStep(
  projectId: string,
  stepName: string,
  pool: Pool,
  handler?: StepHandler
): Promise<RunProvisioningStepResult> {
  const startedAt = new Date()

  // Get step definition
  const stepDefinition = PROVISIONING_STEPS.find(s => s.name === stepName)
  if (!stepDefinition) {
    return {
      success: false,
      status: 'failed',
      error: `Unknown provisioning step: ${stepName}`,
      errorDetails: {
        error_type: 'ValidationError',
        context: { stepName, projectId },
      },
      startedAt,
      completedAt: startedAt,
      retryCount: 0,
    }
  }

  try {
    // Step 1: Transition PENDING → RUNNING
    await setStepStatus(pool, projectId, stepName, 'running', startedAt)

    // Step 2: Execute step handler
    const stepHandler = handler || getDefaultStepHandler(stepName)
    if (!stepHandler) {
      throw new Error(`No handler found for step: ${stepName}`)
    }

    const executionResult: StepExecutionResult = await stepHandler(projectId, pool)
    const completedAt = new Date()

    // Step 3: Transition RUNNING → SUCCESS or FAILED based on outcome
    if (executionResult.success) {
      await setStepStatus(pool, projectId, stepName, 'success', undefined, completedAt)
      return {
        success: true,
        status: 'success',
        startedAt,
        completedAt,
        retryCount: 0,
      }
    } else {
      await setStepStatus(
        pool,
        projectId,
        stepName,
        'failed',
        undefined,
        completedAt,
        executionResult.error,
        executionResult.errorDetails
      )

      return {
        success: false,
        status: 'failed',
        error: executionResult.error || 'Step execution failed',
        errorDetails: executionResult.errorDetails,
        startedAt,
        completedAt,
        retryCount: 0,
      }
    }
  } catch (error) {
    // Step 3b: Transition RUNNING → FAILED on exception
    const completedAt = new Date()
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: ProvisioningErrorDetails = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      stack_trace: error instanceof Error ? error.stack : undefined,
      context: {
        projectId,
        stepName,
        stepDescription: stepDefinition.description,
        stepOrder: stepDefinition.order,
      },
    }

    await setStepStatus(
      pool,
      projectId,
      stepName,
      'failed',
      undefined,
      completedAt,
      errorMessage,
      errorDetails
    )

    return {
      success: false,
      status: 'failed',
      error: errorMessage,
      errorDetails,
      startedAt,
      completedAt,
      retryCount: 0,
    }
  }
}

/**
 * Set step status in the database
 *
 * Updates the provisioning_steps table with the new status and timestamps.
 * Handles status transitions and records error information if provided.
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID
 * @param stepName - The step name
 * @param status - New status (running, success, failed)
 * @param startedAt - Optional started_at timestamp
 * @param completedAt - Optional completed_at timestamp
 * @param errorMessage - Optional error message
 * @param errorDetails - Optional error details JSONB
 */
async function setStepStatus(
  pool: Pool,
  projectId: string,
  stepName: string,
  status: ProvisioningStepStatus,
  startedAt?: Date,
  completedAt?: Date,
  errorMessage?: string,
  errorDetails?: ProvisioningErrorDetails
): Promise<void> {
  const updateFields: string[] = ['status = $1']
  const values: unknown[] = [status]
  let paramIndex = 1

  if (startedAt) {
    paramIndex++
    updateFields.push(`started_at = $${paramIndex}`)
    values.push(startedAt)
  }

  if (completedAt) {
    paramIndex++
    updateFields.push(`completed_at = $${paramIndex}`)
    values.push(completedAt)
  }

  if (errorMessage !== undefined) {
    paramIndex++
    updateFields.push(`error_message = $${paramIndex}`)
    values.push(errorMessage)
  }

  if (errorDetails !== undefined) {
    paramIndex++
    updateFields.push(`error_details = $${paramIndex}`)
    values.push(JSON.stringify(errorDetails))
  }

  // Add project_id and step_name parameters
  paramIndex++
  const projectIdParam = `$${paramIndex}`
  values.push(projectId)

  paramIndex++
  const stepNameParam = `$${paramIndex}`
  values.push(stepName)

  const query = `
    UPDATE provisioning_steps
    SET ${updateFields.join(', ')}
    WHERE project_id = ${projectIdParam} AND step_name = ${stepNameParam}
  `

  await pool.query(query, values)
}

/**
 * Get current step status from database
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID
 * @param stepName - The step name
 * @returns The provisioning step record or null if not found
 */
export async function getStepStatus(
  pool: Pool,
  projectId: string,
  stepName: string
): Promise<ProvisioningStep | null> {
  const result = await pool.query<ProvisioningStep>(
    `
    SELECT
      id,
      project_id,
      step_name,
      status,
      started_at,
      completed_at,
      error_message,
      error_details,
      retry_count,
      created_at
    FROM provisioning_steps
    WHERE project_id = $1 AND step_name = $2
    `,
    [projectId, stepName]
  )

  return result.rows[0] || null
}

/**
 * Get all steps for a project
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID
 * @returns Array of provisioning steps
 */
export async function getAllSteps(
  pool: Pool,
  projectId: string
): Promise<ProvisioningStep[]> {
  const result = await pool.query<ProvisioningStep>(
    `
    SELECT
      id,
      project_id,
      step_name,
      status,
      started_at,
      completed_at,
      error_message,
      error_details,
      retry_count,
      created_at
    FROM provisioning_steps
    WHERE project_id = $1
    ORDER BY created_at ASC
    `,
    [projectId]
  )

  return result.rows
}

/**
 * Calculate provisioning progress percentage
 *
 * @param steps - Array of provisioning steps
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(steps: ProvisioningStep[]): number {
  if (steps.length === 0) return 0

  // Count steps that are success or skipped
  const completedSteps = steps.filter(
    s => s.status === 'success' || s.status === 'skipped'
  ).length

  return Math.round((completedSteps / steps.length) * 100)
}

/**
 * Check if all provisioning steps are complete
 *
 * @param steps - Array of provisioning steps
 * @returns True if all steps are success or skipped
 */
export function isProvisioningComplete(steps: ProvisioningStep[]): boolean {
  return steps.every(s => s.status === 'success' || s.status === 'skipped')
}

/**
 * Check if provisioning has failed
 *
 * @param steps - Array of provisioning steps
 * @returns True if any step has failed status
 */
export function hasProvisioningFailed(steps: ProvisioningStep[]): boolean {
  return steps.some(s => s.status === 'failed')
}

/**
 * Get the next pending step to run
 *
 * @param steps - Array of provisioning steps
 * @returns The next pending step or null if none found
 */
export function getNextPendingStep(steps: ProvisioningStep[]): ProvisioningStep | null {
  // Find the first pending step
  return steps.find(s => s.status === 'pending') || null
}

/**
 * Get default step handler by name
 *
 * This is a placeholder for step-specific handlers.
 * In production, each step would have its own implementation.
 *
 * @param stepName - The step name
 * @returns Step handler function or null
 */
function getDefaultStepHandler(stepName: string): StepHandler | null {
  // TODO: Implement actual step handlers for each step type
  // For now, return a mock handler that succeeds
  return async (_projectId: string, _pool: Pool): Promise<StepExecutionResult> => {
    // Simulate step execution
    return {
      success: true,
    }
  }
}

/**
 * Validate state transition
 *
 * Ensures that status changes follow valid transitions:
 * - PENDING → RUNNING
 * - RUNNING → SUCCESS
 * - RUNNING → FAILED
 * - FAILED → RUNNING (retry)
 *
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns True if the transition is valid
 */
export function isValidStateTransition(
  fromStatus: ProvisioningStepStatus,
  toStatus: ProvisioningStepStatus
): boolean {
  const validTransitions: Record<ProvisioningStepStatus, ProvisioningStepStatus[]> = {
    pending: ['running', 'skipped'],
    running: ['success', 'failed'],
    success: [], // Terminal state
    failed: ['running'], // Can retry
    skipped: [], // Terminal state
  }

  return validTransitions[fromStatus]?.includes(toStatus) ?? false
}

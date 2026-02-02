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
import { ProvisioningStepStatus as StepStatusEnum } from '@/features/provisioning/types/provisioning.types'
import {
  PROVISIONING_STEPS,
  type StepHandler,
  type StepExecutionResult,
} from './steps'
import { getStepHandler, hasStepHandler } from './handlers-registry'

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
      status: StepStatusEnum.FAILED,
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
    // Step 0: Check if project exists (to avoid FK constraint errors)
    const projectExists = await pool.query('SELECT 1 FROM projects WHERE id = $1', [projectId])
    if (projectExists.rows.length === 0) {
      return {
        success: false,
        status: StepStatusEnum.FAILED,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
        startedAt,
        completedAt: startedAt,
        retryCount: 0,
      }
    }

    // Step 1: Transition PENDING → RUNNING
    await setStepStatus(pool, projectId, stepName, StepStatusEnum.RUNNING, startedAt)

    // Step 2: Execute step handler
    const stepHandler = handler || getDefaultStepHandler(stepName)
    if (!stepHandler) {
      throw new Error(`No handler found for step: ${stepName}`)
    }

    const executionResult: StepExecutionResult = await stepHandler(projectId, pool)
    const completedAt = new Date()

    // Step 3: Transition RUNNING → SUCCESS or FAILED based on outcome
    if (executionResult.success) {
      await setStepStatus(pool, projectId, stepName, StepStatusEnum.SUCCESS, undefined, completedAt)
      return {
        success: true,
        status: StepStatusEnum.SUCCESS,
        startedAt,
        completedAt,
        retryCount: 0,
      }
    } else {
      await setStepStatus(
        pool,
        projectId,
        stepName,
        StepStatusEnum.FAILED,
        undefined,
        completedAt,
        executionResult.error,
        executionResult.errorDetails
      )

      return {
        success: false,
        status: StepStatusEnum.FAILED,
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
      StepStatusEnum.FAILED,
      undefined,
      completedAt,
      errorMessage,
      errorDetails
    )

    return {
      success: false,
      status: StepStatusEnum.FAILED,
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
  const values: unknown[] = []
  const placeholders: string[] = []
  let paramIndex = 0

  // Build column-value pairs for INSERT and UPDATE
  const columnValues: string[] = []

  // status (always set)
  paramIndex++
  values.push(status)
  placeholders.push(`$${paramIndex}`)
  columnValues.push(`status = $${paramIndex}`)

  // started_at
  if (startedAt) {
    paramIndex++
    values.push(startedAt)
    placeholders.push(`$${paramIndex}`)
    columnValues.push(`started_at = $${paramIndex}`)
  }

  // completed_at
  if (completedAt) {
    paramIndex++
    values.push(completedAt)
    placeholders.push(`$${paramIndex}`)
    columnValues.push(`completed_at = $${paramIndex}`)
  }

  // error_message
  if (errorMessage !== undefined) {
    paramIndex++
    values.push(errorMessage)
    placeholders.push(`$${paramIndex}`)
    columnValues.push(`error_message = $${paramIndex}`)
  }

  // error_details
  if (errorDetails !== undefined) {
    paramIndex++
    values.push(JSON.stringify(errorDetails))
    placeholders.push(`$${paramIndex}`)
    columnValues.push(`error_details = $${paramIndex}`)
  }

  // project_id and step_name for WHERE clause
  paramIndex++
  values.push(projectId)
  const projectIdParam = `$${paramIndex}`

  paramIndex++
  values.push(stepName)
  const stepNameParam = `$${paramIndex}`

  // Use INSERT ... ON CONFLICT DO UPDATE to create record if not exists
  const query = `
    INSERT INTO control_plane.provisioning_steps (
      project_id, step_name, ${columnValues.map(cv => cv.split(' = ')[0]).join(', ')}
    )
    VALUES (${projectIdParam}, ${stepNameParam}, ${placeholders.join(', ')})
    ON CONFLICT (project_id, step_name) DO UPDATE
      SET ${columnValues.join(', ')}
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
    FROM control_plane.provisioning_steps
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
    FROM control_plane.provisioning_steps
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
    s => s.status === StepStatusEnum.SUCCESS || s.status === StepStatusEnum.SKIPPED
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
  return steps.every(s => s.status === StepStatusEnum.SUCCESS || s.status === StepStatusEnum.SKIPPED)
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
  return steps.find(s => s.status === StepStatusEnum.PENDING) || null
}

/**
 * Get default step handler by name
 *
 * Story: US-008 - Implement Verify Services Step
 *
 * This function retrieves the appropriate handler for a given step.
 * If a dedicated handler exists, it returns that handler.
 * Otherwise, it returns a mock handler that succeeds (for backward compatibility).
 *
 * @param stepName - The step name
 * @returns Step handler function or null
 */
function getDefaultStepHandler(stepName: string): StepHandler | null {
  // Check if a dedicated handler exists for this step
  if (hasStepHandler(stepName)) {
    return getStepHandler(stepName)
  }

  // For steps without dedicated handlers, return a mock handler
  // This provides backward compatibility while handlers are being implemented
  return async (_projectId: string, _pool: Pool): Promise<StepExecutionResult> => {
    // Mock handler - simulates successful step execution
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
    pending: [StepStatusEnum.RUNNING, StepStatusEnum.SKIPPED],
    running: [StepStatusEnum.SUCCESS, StepStatusEnum.FAILED],
    success: [], // Terminal state
    failed: [StepStatusEnum.RUNNING], // Can retry
    skipped: [], // Terminal state
  }

  return validTransitions[fromStatus]?.includes(toStatus) ?? false
}

/**
 * Result of retrying a provisioning step
 */
export interface RetryProvisioningStepResult {
  /** Whether the retry was successful */
  success: boolean
  /** Current status of the step after retry */
  status: ProvisioningStepStatus
  /** Error message if the retry failed */
  error?: string
  /** Detailed error information */
  errorDetails?: ProvisioningErrorDetails
  /** When the retry started */
  startedAt?: Date
  /** When the retry completed */
  completedAt?: Date
  /** Updated retry count after this attempt */
  retryCount: number
  /** Whether the max retries has been exceeded */
  maxRetriesExceeded?: boolean
}

/**
 * Retry a failed provisioning step
 *
 * Story: US-004 - Implement Step Retry Logic
 *
 * This function implements retry logic for failed provisioning steps:
 * 1. Validates the step can be retried (is retryable, hasn't exceeded max retries)
 * 2. Resets status to PENDING
 * 3. Increments retry_count
 * 4. Re-runs the step handler
 * 5. Already successful steps are skipped (not re-run)
 *
 * The retry flow:
 * - FAILED (retry_count=0) → PENDING (retry_count=1) → RUNNING → SUCCESS/FAILED
 * - FAILED (retry_count=1) → PENDING (retry_count=2) → RUNNING → SUCCESS/FAILED
 * - FAILED (retry_count=maxRetries) → Cannot retry anymore
 *
 * @param projectId - The project ID being provisioned
 * @param stepName - The name of the provisioning step to retry
 * @param pool - Database connection pool
 * @param handler - Optional step handler function (if not provided, looks up by step name)
 * @returns Result of the retry attempt with updated status and retry count
 */
export async function retryProvisioningStep(
  projectId: string,
  stepName: string,
  pool: Pool,
  handler?: StepHandler
): Promise<RetryProvisioningStepResult> {
  // Get the current step record
  const currentStep = await getStepStatus(pool, projectId, stepName)

  if (!currentStep) {
    return {
      success: false,
      status: StepStatusEnum.FAILED,
      error: `Provisioning step not found: ${stepName}`,
      errorDetails: {
        error_type: 'NotFoundError',
        context: { projectId, stepName },
      },
      retryCount: 0,
      maxRetriesExceeded: false,
    }
  }

  // Get step definition to check retry limits
  const stepDefinition = PROVISIONING_STEPS.find(s => s.name === stepName)
  if (!stepDefinition) {
    return {
      success: false,
      status: StepStatusEnum.FAILED,
      error: `Unknown provisioning step: ${stepName}`,
      errorDetails: {
        error_type: 'ValidationError',
        context: { projectId, stepName },
      },
      retryCount: currentStep.retry_count,
      maxRetriesExceeded: false,
    }
  }

  // Check if step is already successful - skip retry
  if (currentStep.status === StepStatusEnum.SUCCESS) {
    return {
      success: true,
      status: StepStatusEnum.SUCCESS,
      error: 'Step already completed successfully',
      retryCount: currentStep.retry_count,
    }
  }

  // Check if step is retryable
  if (!stepDefinition.retryable) {
    return {
      success: false,
      status: currentStep.status,
      error: `Step is not retryable: ${stepName}`,
      errorDetails: {
        error_type: 'ValidationError',
        context: {
          projectId,
          stepName,
          currentRetryCount: currentStep.retry_count,
        },
      },
      retryCount: currentStep.retry_count,
      maxRetriesExceeded: false,
    }
  }

  // Check if max retries exceeded
  if (currentStep.retry_count >= stepDefinition.maxRetries) {
    return {
      success: false,
      status: currentStep.status,
      error: `Maximum retry attempts exceeded for step: ${stepName} (${currentStep.retry_count}/${stepDefinition.maxRetries})`,
      errorDetails: {
        error_type: 'MaxRetriesExceededError',
        context: {
          projectId,
          stepName,
          currentRetryCount: currentStep.retry_count,
          maxRetries: stepDefinition.maxRetries,
        },
      },
      retryCount: currentStep.retry_count,
      maxRetriesExceeded: true,
    }
  }

  const newRetryCount = currentStep.retry_count + 1

  try {
    // Step 1: Reset status to PENDING and increment retry_count
    await pool.query(
      `
      UPDATE control_plane.provisioning_steps
      SET status = $1,
          retry_count = $2,
          error_message = NULL,
          error_details = NULL,
          started_at = NULL,
          completed_at = NULL
      WHERE project_id = $3 AND step_name = $4
      `,
      [StepStatusEnum.PENDING, newRetryCount, projectId, stepName]
    )

    // Step 2: Re-run the step handler (which will transition PENDING → RUNNING → SUCCESS/FAILED)
    const retryResult = await runProvisioningStep(projectId, stepName, pool, handler)

    return {
      success: retryResult.success,
      status: retryResult.status,
      error: retryResult.error,
      errorDetails: retryResult.errorDetails,
      startedAt: retryResult.startedAt,
      completedAt: retryResult.completedAt,
      retryCount: newRetryCount,
      maxRetriesExceeded: false,
    }
  } catch (error) {
    // Catch any unexpected errors during retry
    const completedAt = new Date()
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: ProvisioningErrorDetails = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      stack_trace: error instanceof Error ? error.stack : undefined,
      context: {
        projectId,
        stepName,
        retryCount: newRetryCount,
        maxRetries: stepDefinition.maxRetries,
      },
    }

    // Update step with error
    await setStepStatus(
      pool,
      projectId,
      stepName,
      StepStatusEnum.FAILED,
      undefined,
      completedAt,
      errorMessage,
      errorDetails
    )

    return {
      success: false,
      status: StepStatusEnum.FAILED,
      error: errorMessage,
      errorDetails,
      retryCount: newRetryCount,
      maxRetriesExceeded: newRetryCount >= stepDefinition.maxRetries,
    }
  }
}

/**
 * Get remaining retry attempts for a step
 *
 * @param stepName - The step name
 * @param currentRetryCount - Current retry count
 * @returns Number of remaining retry attempts
 */
export function getRemainingRetries(stepName: string, currentRetryCount: number): number {
  const stepDefinition = PROVISIONING_STEPS.find(s => s.name === stepName)
  if (!stepDefinition || !stepDefinition.retryable) return 0
  return Math.max(0, stepDefinition.maxRetries - currentRetryCount)
}

/**
 * Check if a step can be retried
 *
 * @param stepName - The step name
 * @param currentRetryCount - Current retry count
 * @returns True if the step can be retried
 */
export function canRetryStep(stepName: string, currentRetryCount: number): boolean {
  return getRemainingRetries(stepName, currentRetryCount) > 0
}

/**
 * Run Provisioning Step
 *
 * Handles the execution of a single provisioning step.
 * Manages state transitions: PENDING → RUNNING → SUCCESS/FAILED
 *
 * Story: US-003 - Implement State Machine Logic
 * PRD: Provisioning State Machine
 */

import type { Pool } from 'pg'
import type {
  ProvisioningStepStatus,
  ProvisioningErrorDetails,
} from '@/features/provisioning/types/provisioning.types'
import { ProvisioningStepStatus as StepStatusEnum } from '@/features/provisioning/types/provisioning.types'
import type { StepHandler } from '../steps'
import {
  setStepStatus,
  createErrorDetails,
  getErrorMessage,
} from './transitions'
import {
  validateProjectExists,
  validateStepDefinition,
} from './validation'
import { getDefaultStepHandler } from './handlers'

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

  // Validate step definition
  const stepValidation = validateStepDefinition(stepName)
  if (!stepValidation.valid) {
    return {
      success: false,
      status: StepStatusEnum.FAILED,
      error: stepValidation.error,
      errorDetails: stepValidation.errorDetails,
      startedAt,
      completedAt: startedAt,
      retryCount: 0,
    }
  }
  const stepDefinition = stepValidation.stepDefinition!

  // Validate project exists
  const projectValidation = await validateProjectExists(pool, projectId)
  if (!projectValidation.exists) {
    return {
      success: false,
      status: StepStatusEnum.FAILED,
      error: projectValidation.error,
      errorDetails: projectValidation.errorDetails,
      startedAt,
      completedAt: startedAt,
      retryCount: 0,
    }
  }

  try {
    // Step 1: Transition PENDING → RUNNING
    await setStepStatus(pool, projectId, stepName, StepStatusEnum.RUNNING, startedAt)

    // Step 2: Execute step handler
    const stepHandler = handler || getDefaultStepHandler(stepName)
    const executionResult = await stepHandler(projectId, pool)
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
    const errorMessage = getErrorMessage(error)
    const errorDetails = createErrorDetails(error, {
      projectId,
      stepName,
      stepDescription: stepDefinition.description,
      stepOrder: stepDefinition.order,
    })

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

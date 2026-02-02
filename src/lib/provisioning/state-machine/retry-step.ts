/**
 * Retry Provisioning Step
 *
 * Handles retry logic for failed provisioning steps.
 * Manages the retry flow: FAILED → PENDING → RUNNING → SUCCESS/FAILED
 *
 * Story: US-004 - Implement Step Retry Logic
 * PRD: Provisioning State Machine
 */

import type { Pool } from 'pg'
import type {
  ProvisioningStepStatus,
  ProvisioningErrorDetails,
} from '@/features/provisioning/types/provisioning.types'
import { ProvisioningStepStatus as StepStatusEnum } from '@/features/provisioning/types/provisioning.types'
import { PROVISIONING_STEPS, type StepHandler } from '../steps'
import {
  setStepStatus,
  createErrorDetails,
  getErrorMessage,
  resetStepForRetry,
} from './transitions'
import { validateStepRetryable } from './validation'
import { getStepStatus } from './state-definitions'
import { runProvisioningStep } from './run-step'

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

  // Validate step can be retried
  const retryValidation = validateStepRetryable(currentStep)
  if (!retryValidation.canRetry) {
    return {
      success: false,
      status: currentStep.status,
      error: retryValidation.error,
      errorDetails: retryValidation.errorDetails,
      retryCount: currentStep.retry_count,
      maxRetriesExceeded: retryValidation.maxRetriesExceeded,
    }
  }

  const newRetryCount = currentStep.retry_count + 1

  try {
    // Step 1: Reset status to PENDING and increment retry_count
    await resetStepForRetry(pool, projectId, stepName, newRetryCount)

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
    const errorMessage = getErrorMessage(error)
    const errorDetails = createErrorDetails(error, {
      projectId,
      stepName,
      retryCount: newRetryCount,
      maxRetries: stepDefinition.maxRetries,
    })

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

/**
 * State Machine Validation
 *
 * Validation logic for state transitions and provisioning step checks.
 * Ensures that status changes follow valid transitions and steps meet prerequisites.
 */

import type { Pool } from 'pg'
import type {
  ProvisioningStep,
  ProvisioningStepStatus,
  ProvisioningErrorDetails,
} from '@/features/provisioning/types/provisioning.types'
import { ProvisioningStepStatus as StepStatusEnum } from '@/features/provisioning/types/provisioning.types'
import { PROVISIONING_STEPS } from '../steps'

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
 * Validate project exists
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID to validate
 * @returns True if project exists, false otherwise
 */
export async function validateProjectExists(
  pool: Pool,
  projectId: string
): Promise<{ exists: boolean; error?: string; errorDetails?: ProvisioningErrorDetails }> {
  const result = await pool.query('SELECT 1 FROM projects WHERE id = $1', [projectId])

  if (result.rows.length === 0) {
    return {
      exists: false,
      error: `Project not found: ${projectId}`,
      errorDetails: {
        error_type: 'NotFoundError',
        context: { projectId },
      },
    }
  }

  return { exists: true }
}

/**
 * Validate step definition exists
 *
 * @param stepName - The step name to validate
 * @returns Step definition if found, error details otherwise
 */
export function validateStepDefinition(stepName: string): {
  valid: boolean
  stepDefinition?: typeof PROVISIONING_STEPS[0]
  error?: string
  errorDetails?: ProvisioningErrorDetails
} {
  const stepDefinition = PROVISIONING_STEPS.find(s => s.name === stepName)

  if (!stepDefinition) {
    return {
      valid: false,
      error: `Unknown provisioning step: ${stepName}`,
      errorDetails: {
        error_type: 'ValidationError',
        context: { stepName },
      },
    }
  }

  return { valid: true, stepDefinition }
}

/**
 * Validate step can be retried
 *
 * Checks if step is retryable and hasn't exceeded max retries
 *
 * @param currentStep - Current step record
 * @returns Validation result with error details if not retryable
 */
export function validateStepRetryable(currentStep: ProvisioningStep): {
  canRetry: boolean
  error?: string
  errorDetails?: ProvisioningErrorDetails
  maxRetriesExceeded?: boolean
} {
  const stepDefinition = PROVISIONING_STEPS.find(s => s.name === currentStep.step_name)

  if (!stepDefinition) {
    return {
      canRetry: false,
      error: `Unknown provisioning step: ${currentStep.step_name}`,
      errorDetails: {
        error_type: 'ValidationError',
        context: { stepName: currentStep.step_name },
      },
    }
  }

  // Check if step is already successful
  if (currentStep.status === StepStatusEnum.SUCCESS) {
    return {
      canRetry: false,
      error: 'Step already completed successfully',
    }
  }

  // Check if step is retryable
  if (!stepDefinition.retryable) {
    return {
      canRetry: false,
      error: `Step is not retryable: ${currentStep.step_name}`,
      errorDetails: {
        error_type: 'ValidationError',
        context: {
          stepName: currentStep.step_name,
          currentRetryCount: currentStep.retry_count,
        },
      },
    }
  }

  // Check if max retries exceeded
  if (currentStep.retry_count >= stepDefinition.maxRetries) {
    return {
      canRetry: false,
      error: `Maximum retry attempts exceeded for step: ${currentStep.step_name} (${currentStep.retry_count}/${stepDefinition.maxRetries})`,
      errorDetails: {
        error_type: 'MaxRetriesExceededError',
        context: {
          stepName: currentStep.step_name,
          currentRetryCount: currentStep.retry_count,
          maxRetries: stepDefinition.maxRetries,
        },
      },
      maxRetriesExceeded: true,
    }
  }

  return { canRetry: true }
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

/**
 * State Machine Handler Registry
 *
 * Manages step handler lookup and default handler logic.
 * Provides fallback handlers for steps without dedicated implementations.
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'
import { getStepHandler, hasStepHandler } from '../handlers-registry'

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
 * @returns Step handler function
 */
export function getDefaultStepHandler(stepName: string): StepHandler {
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
 * Execute step handler with error handling
 *
 * Wraps handler execution with standardized error handling.
 *
 * @param handler - The step handler to execute
 * @param projectId - The project ID
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export async function executeHandler(
  handler: StepHandler,
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> {
  try {
    return await handler(projectId, pool)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorDetails: {
        error_type: error instanceof Error ? error.constructor.name : 'Error',
        stack_trace: error instanceof Error ? error.stack : undefined,
        context: { projectId },
      },
    }
  }
}

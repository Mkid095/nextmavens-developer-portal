/**
 * State Machine Transitions
 *
 * Handles state transitions and database updates for provisioning steps.
 * Manages status changes: PENDING → RUNNING → SUCCESS/FAILED
 */

import type { Pool } from 'pg'
import type {
  ProvisioningStepStatus,
  ProvisioningErrorDetails,
} from '@/features/provisioning/types/provisioning.types'

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
export async function setStepStatus(
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
 * Reset step for retry
 *
 * Resets a failed step back to PENDING status and increments retry count.
 * Clears error information and timestamps for a fresh retry attempt.
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID
 * @param stepName - The step name
 * @param newRetryCount - The new retry count after incrementing
 */
export async function resetStepForRetry(
  pool: Pool,
  projectId: string,
  stepName: string,
  newRetryCount: number
): Promise<void> {
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
    [newRetryCount, projectId, stepName]
  )
}

/**
 * Create error details object
 *
 * Standardizes error information for storage in the database.
 *
 * @param error - The error object
 * @param context - Additional context about the error
 * @returns Formatted error details
 */
export function createErrorDetails(
  error: unknown,
  context: Record<string, unknown>
): ProvisioningErrorDetails {
  return {
    error_type: error instanceof Error ? error.constructor.name : 'Error',
    stack_trace: error instanceof Error ? error.stack : undefined,
    context,
  }
}

/**
 * Get error message from error object
 *
 * Extracts a string error message from various error types.
 *
 * @param error - The error object
 * @returns String error message
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

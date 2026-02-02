/**
 * State Machine State Definitions
 *
 * Query functions for retrieving provisioning state from the database.
 * Provides access to step statuses and project provisioning state.
 */

import type { Pool } from 'pg'
import type { ProvisioningStep } from '@/features/provisioning/types/provisioning.types'
import { ProvisioningStepStatus as StepStatusEnum } from '@/features/provisioning/types/provisioning.types'

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
 * Get failed steps for a project
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID
 * @returns Array of failed provisioning steps
 */
export async function getFailedSteps(
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
    WHERE project_id = $1 AND status = $2
    ORDER BY created_at ASC
    `,
    [projectId, StepStatusEnum.FAILED]
  )

  return result.rows
}

/**
 * Get running steps for a project
 *
 * @param pool - Database connection pool
 * @param projectId - The project ID
 * @returns Array of running provisioning steps
 */
export async function getRunningSteps(
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
    WHERE project_id = $1 AND status = $2
    ORDER BY created_at ASC
    `,
    [projectId, StepStatusEnum.RUNNING]
  )

  return result.rows
}

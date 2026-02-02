/**
 * Active to Suspended Transition
 * Handles transition of projects from ACTIVE to SUSPENDED status
 */

import { getPool } from '@/lib/db'
import { ProjectLifecycleStatus } from '@/features/project-lifecycle/types/project-status.types'
import type { StatusTransitionResult } from '../types'

/**
 * Transition a project from ACTIVE to SUSPENDED when hard cap is exceeded
 *
 * This function checks if a project has exceeded its hard cap and suspends it.
 * Note: This is integrated with the existing suspension system in abuse-controls.
 *
 * @param projectId - The project ID to check and potentially suspend
 * @returns StatusTransitionResult if transitioned, null otherwise
 */
export async function transitionActiveToSuspended(
  projectId: string
): Promise<StatusTransitionResult | null> {
  const pool = getPool()

  try {
    // Get project details
    const projectResult = await pool.query(
      `SELECT id, project_name, status
       FROM projects
       WHERE id = $1`,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return null
    }

    const project = projectResult.rows[0]
    const currentStatus = project.status as ProjectLifecycleStatus

    // Only transition ACTIVE projects
    if (currentStatus !== ProjectLifecycleStatus.ACTIVE) {
      return null
    }

    // Check if project has an active suspension (hard cap exceeded)
    // The suspension check background job handles the actual suspension
    // This function just reports on it
    const suspensionResult = await pool.query(
      `SELECT id, cap_exceeded, suspended_at
       FROM suspensions
       WHERE project_id = $1 AND resolved_at IS NULL`,
      [projectId]
    )

    if (suspensionResult.rows.length === 0) {
      // No suspension - project is within limits
      return null
    }

    const suspension = suspensionResult.rows[0]

    // Project has a suspension but status is still ACTIVE - update it
    await pool.query(
      `UPDATE projects
       SET status = 'suspended', updated_at = NOW()
       WHERE id = $1`,
      [projectId]
    )

    const result: StatusTransitionResult = {
      projectId,
      projectName: project.project_name,
      previousStatus: ProjectLifecycleStatus.ACTIVE,
      newStatus: ProjectLifecycleStatus.SUSPENDED,
      reason: `Hard cap exceeded: ${suspension.cap_exceeded}`,
      transitionedAt: new Date(suspension.suspended_at),
    }

    console.log(
      `[Auto Status] Suspended project ${projectId} (${project.project_name}) due to hard cap: ${suspension.cap_exceeded}`
    )

    return result
  } catch (error) {
    console.error(`[Auto Status] Error checking project ${projectId}:`, error)
    return null
  }
}

/**
 * Created to Active Transition
 * Handles transition of projects from CREATED to ACTIVE status
 */

import { getPool } from '@/lib/db'
import { ProjectLifecycleStatus } from '@/features/project-lifecycle/types/project-status.types'
import { getAllSteps, isProvisioningComplete } from '@/lib/provisioning/state-machine'
import { logProjectAction } from '@nextmavenspacks/audit-logs-database'
import { systemActor } from '../utils'
import type { StatusTransitionResult } from '../types'

/**
 * Transition a project from CREATED to ACTIVE after provisioning completes
 *
 * This function checks if provisioning is complete and activates the project.
 *
 * @param projectId - The project ID to check and potentially activate
 * @returns StatusTransitionResult if transitioned, null otherwise
 */
export async function transitionCreatedToActive(
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
      console.log(`[Auto Status] Project ${projectId} not found`)
      return null
    }

    const project = projectResult.rows[0]
    const currentStatus = project.status as ProjectLifecycleStatus

    // Only transition CREATED projects
    if (currentStatus !== ProjectLifecycleStatus.CREATED) {
      return null
    }

    // Check if provisioning is complete
    const steps = await getAllSteps(pool, projectId)

    if (!isProvisioningComplete(steps)) {
      console.log(
        `[Auto Status] Project ${projectId} provisioning not complete yet`
      )
      return null
    }

    // All steps successful - activate the project
    await pool.query(
      `UPDATE projects
       SET status = 'active', updated_at = NOW()
       WHERE id = $1
       RETURNING id, project_name, status`,
      [projectId]
    )

    const result: StatusTransitionResult = {
      projectId,
      projectName: project.project_name,
      previousStatus: ProjectLifecycleStatus.CREATED,
      newStatus: ProjectLifecycleStatus.ACTIVE,
      reason: 'Provisioning completed successfully',
      transitionedAt: new Date(),
    }

    // Log to audit logs
    await logProjectAction.updated(
      systemActor(),
      projectId,
      {
        action: 'auto_activated',
        previous_status: ProjectLifecycleStatus.CREATED,
        new_status: ProjectLifecycleStatus.ACTIVE,
        reason: 'Provisioning completed successfully',
      },
      {
        metadata: {
          source: 'auto-status-transitions-job',
          transition_type: 'created_to_active',
        },
      }
    ).catch((error) => {
      console.error('[Auto Status] Failed to log to audit:', error)
    })

    console.log(
      `[Auto Status] Activated project ${projectId} (${project.project_name}) after provisioning completed`
    )

    return result
  } catch (error) {
    console.error(`[Auto Status] Error transitioning project ${projectId}:`, error)
    return null
  }
}

/**
 * Suspended to Active Transition
 * Handles transition of projects from SUSPENDED to ACTIVE status
 */

import { getPool } from '@/lib/db'
import { ProjectLifecycleStatus } from '@/features/project-lifecycle/types/project-status.types'
import { logProjectAction } from '@nextmavenspacks/audit-logs-database'
import { systemActor } from '../utils'
import type { StatusTransitionResult } from '../types'

/**
 * Transition a project from SUSPENDED to ACTIVE after quota reset
 *
 * This function checks if a suspended project's quota has been reset
 * and the suspension reason was quota-related. If so, it reactivates the project.
 *
 * @param projectId - The project ID to check and potentially reactivate
 * @returns StatusTransitionResult if transitioned, null otherwise
 */
export async function transitionSuspendedToActive(
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

    // Only transition SUSPENDED projects
    if (currentStatus !== ProjectLifecycleStatus.SUSPENDED) {
      return null
    }

    // Check if project has an active suspension
    const suspensionResult = await pool.query(
      `SELECT s.id, s.reason, s.cap_exceeded, s.suspended_at, q.reset_at
       FROM suspensions s
       CROSS JOIN lateral (
         SELECT reset_at
         FROM quotas
         WHERE project_id = s.project_id AND service = s.cap_exceeded
         LIMIT 1
       ) q
       WHERE s.project_id = $1 AND s.resolved_at IS NULL`,
      [projectId]
    )

    if (suspensionResult.rows.length === 0) {
      // No active suspension - nothing to do
      return null
    }

    const suspension = suspensionResult.rows[0]
    const resetAt = new Date(suspension.reset_at)
    const now = new Date()

    // Check if quota has been reset (reset_at is in the past)
    if (resetAt > now) {
      // Quota not reset yet
      return null
    }

    // Quota has been reset - resolve the suspension and activate the project
    await pool.query('BEGIN')

    try {
      // Mark suspension as resolved
      await pool.query(
        `UPDATE suspensions
         SET resolved_at = NOW()
         WHERE project_id = $1 AND resolved_at IS NULL`,
        [projectId]
      )

      // Add to suspension history
      await pool.query(
        `INSERT INTO suspension_history (project_id, action, reason, notes)
         VALUES ($1, 'unsuspended', $2, $3)`,
        [
          projectId,
          suspension.reason,
          'Quota reset - automatically reactivated',
        ]
      )

      // Update project status to active
      await pool.query(
        `UPDATE projects
         SET status = 'active', updated_at = NOW()
         WHERE id = $1`,
        [projectId]
      )

      await pool.query('COMMIT')

      const result: StatusTransitionResult = {
        projectId,
        projectName: project.project_name,
        previousStatus: ProjectLifecycleStatus.SUSPENDED,
        newStatus: ProjectLifecycleStatus.ACTIVE,
        reason: 'Quota reset - suspension cleared automatically',
        transitionedAt: new Date(),
      }

      // Log to audit logs
      await logProjectAction.updated(
        systemActor(),
        projectId,
        {
          action: 'auto_reactivated',
          previous_status: ProjectLifecycleStatus.SUSPENDED,
          new_status: ProjectLifecycleStatus.ACTIVE,
          reason: 'Quota reset - suspension cleared automatically',
        },
        {
          metadata: {
            source: 'auto-status-transitions-job',
            transition_type: 'suspended_to_active',
          },
        }
      ).catch((error) => {
        console.error('[Auto Status] Failed to log to audit:', error)
      })

      console.log(
        `[Auto Status] Reactivated project ${projectId} (${project.project_name}) after quota reset`
      )

      return result
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error(`[Auto Status] Error transitioning project ${projectId}:`, error)
    return null
  }
}

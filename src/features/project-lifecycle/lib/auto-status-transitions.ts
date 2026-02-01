/**
 * Auto Status Transitions Background Job
 *
 * Handles automatic project status transitions based on events:
 * 1. CREATED → ACTIVE after provisioning completes successfully
 * 2. ACTIVE → SUSPENDED when hard cap is exceeded
 * 3. SUSPENDED → ACTIVE after quota reset (if suspension was due to quota)
 *
 * Story: US-010 from prd-project-lifecycle.json
 */

import { getPool } from '@/lib/db'
import { ProjectLifecycleStatus } from '@/features/project-lifecycle/types/project-status.types'
import {
  getAllSteps,
  isProvisioningComplete,
} from '@/lib/provisioning/state-machine'
import { logProjectAction } from '@nextmavenspacks/audit-logs-database'

/**
 * System actor for background job actions
 */
function systemActor() {
  return {
    type: 'system' as const,
    id: 'auto-status-transitions-job',
    name: 'Auto Status Transitions Background Job',
  }
}

/**
 * Result of a status transition operation
 */
export interface StatusTransitionResult {
  projectId: string
  projectName: string
  previousStatus: ProjectLifecycleStatus
  newStatus: ProjectLifecycleStatus
  reason: string
  transitionedAt: Date
}

/**
 * Background job result interface
 */
export interface AutoStatusTransitionsJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of projects checked */
  projectsChecked: number
  /** Number of status transitions made */
  transitionsMade: number
  /** Details of transitions */
  transitions: StatusTransitionResult[]
  /** Error message if job failed */
  error?: string
}

/**
 * Transition a project from CREATED to ACTIVE after provisioning completes
 *
 * This function checks if provisioning is complete and activates the project.
 *
 * @param projectId - The project ID to check and potentially activate
 * @returns StatusTransitionResult if transitioned, null otherwise
 */
async function transitionCreatedToActive(
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

/**
 * Transition a project from ACTIVE to SUSPENDED when hard cap is exceeded
 *
 * This function checks if a project has exceeded its hard cap and suspends it.
 * Note: This is integrated with the existing suspension system in abuse-controls.
 *
 * @param projectId - The project ID to check and potentially suspend
 * @returns StatusTransitionResult if transitioned, null otherwise
 */
async function transitionActiveToSuspended(
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

/**
 * Transition a project from SUSPENDED to ACTIVE after quota reset
 *
 * This function checks if a suspended project's quota has been reset
 * and the suspension reason was quota-related. If so, it reactivates the project.
 *
 * @param projectId - The project ID to check and potentially reactivate
 * @returns StatusTransitionResult if transitioned, null otherwise
 */
async function transitionSuspendedToActive(
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

/**
 * Run the auto status transitions background job
 *
 * This function checks all projects and performs automatic status transitions:
 * 1. CREATED → ACTIVE after provisioning completes
 * 2. ACTIVE → SUSPENDED when hard cap exceeded
 * 3. SUSPENDED → ACTIVE after quota reset (if quota-related suspension)
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runAutoStatusTransitionsJob();
 * console.log(`Job completed: ${result.transitionsMade} transitions made`);
 */
export async function runAutoStatusTransitionsJob(): Promise<AutoStatusTransitionsJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Auto Status Job] Started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  const pool = getPool()

  try {
    // Get all CREATED projects to check for provisioning completion
    const createdProjectsResult = await pool.query(
      `SELECT id
       FROM projects
       WHERE status = 'created'`
    )

    const createdProjects = createdProjectsResult.rows

    // Get all ACTIVE projects to check for hard cap violations
    // (This syncs status with existing suspensions)
    const activeProjectsResult = await pool.query(
      `SELECT id
       FROM projects
       WHERE status = 'active'`
    )

    const activeProjects = activeProjectsResult.rows

    // Get all SUSPENDED projects to check for quota reset
    const suspendedProjectsResult = await pool.query(
      `SELECT id
       FROM projects
       WHERE status = 'suspended'`
    )

    const suspendedProjects = suspendedProjectsResult.rows

    const projectsChecked =
      createdProjects.length + activeProjects.length + suspendedProjects.length

    console.log(`[Auto Status Job] Checking ${projectsChecked} projects`)
    console.log(
      `  - ${createdProjects.length} CREATED projects (provisioning completion)`
    )
    console.log(`  - ${activeProjects.length} ACTIVE projects (hard cap check)`)
    console.log(`  - ${suspendedProjects.length} SUSPENDED projects (quota reset)`)

    const transitions: StatusTransitionResult[] = []

    // Check CREATED projects for provisioning completion
    for (const project of createdProjects) {
      const result = await transitionCreatedToActive(project.id)
      if (result) {
        transitions.push(result)
      }
    }

    // Check ACTIVE projects for hard cap violations (sync with suspensions)
    for (const project of activeProjects) {
      const result = await transitionActiveToSuspended(project.id)
      if (result) {
        transitions.push(result)
      }
    }

    // Check SUSPENDED projects for quota reset
    for (const project of suspendedProjects) {
      const result = await transitionSuspendedToActive(project.id)
      if (result) {
        transitions.push(result)
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log(`[Auto Status Job] Completed`)
    console.log(`[Auto Status Job] Duration: ${durationMs}ms`)
    console.log(`[Auto Status Job] Projects checked: ${projectsChecked}`)
    console.log(`[Auto Status Job] Transitions made: ${transitions.length}`)

    if (transitions.length > 0) {
      console.log(`[Auto Status Job] Transitions:`)
      transitions.forEach((t, index) => {
        console.log(
          `  ${index + 1}. ${t.projectName}: ${t.previousStatus.toUpperCase()} → ${t.newStatus.toUpperCase()}`
        )
        console.log(`     Reason: ${t.reason}`)
      })
    }

    console.log('='.repeat(60))

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      transitionsMade: transitions.length,
      transitions,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Auto Status Job] Failed`)
    console.error(`[Auto Status Job] Duration: ${durationMs}ms`)
    console.error(`[Auto Status Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      transitionsMade: 0,
      transitions: [],
      error: errorMessage,
    }
  }
}

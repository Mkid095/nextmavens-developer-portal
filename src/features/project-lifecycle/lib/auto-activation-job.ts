/**
 * Auto-Activation Background Job
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * This module provides the background job for automatically activating projects
 * after provisioning completes.
 *
 * Transitions: CREATED → ACTIVE after all provisioning steps succeed
 *
 * Usage:
 * - Call runAutoActivationJob() from a cron job (recommended: every 5 minutes)
 * - The function will find all CREATED projects with complete provisioning
 * - It will automatically transition them to ACTIVE status
 */

import { getPool } from '@/lib/db'
import { logProjectAction, systemActor } from '@nextmavenspacks/audit-logs-database'
import { ProjectStatus, isValidTransition } from '@/lib/types/project-lifecycle.types'
import {
  getAllSteps,
  isProvisioningComplete,
  hasProvisioningFailed,
} from '@/lib/provisioning/state-machine'

/**
 * Auto-activation job result interface
 */
export interface AutoActivationJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of CREATED projects checked */
  projectsChecked: number
  /** Number of projects auto-activated */
  projectsActivated: number
  /** Details of activated projects */
  activatedProjects: Array<{
    projectId: string
    projectName: string
    activatedAt: Date
  }>
  /** Number of projects with failed provisioning */
  failedProvisioning: number
  /** Error message if job failed */
  error?: string
}

/**
 * Run the auto-activation background job
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 * Transition: CREATED → ACTIVE after provisioning completes
 *
 * This function:
 * 1. Finds all projects in CREATED status
 * 2. Checks if their provisioning is complete (all steps success/skipped)
 * 3. Automatically activates projects with complete provisioning
 * 4. Skips projects with failed or incomplete provisioning
 * 5. Logs all activations to audit log
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler (recommended: every 5 minutes)
 * const result = await runAutoActivationJob();
 * console.log(`Job completed: ${result.projectsActivated} projects activated`);
 */
export async function runAutoActivationJob(): Promise<AutoActivationJobResult> {
  const startTime = new Date()
  const pool = getPool()

  console.log('='.repeat(60))
  console.log(`[Auto-Activation Job] Started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Step 1: Find all projects in CREATED status
    const createdProjectsResult = await pool.query(`
      SELECT
        p.id,
        p.name as project_name,
        p.status,
        p.owner_id
      FROM control_plane.projects p
      WHERE p.status = 'created'
      ORDER BY p.created_at ASC
    `)

    const createdProjects = createdProjectsResult.rows
    const projectsChecked = createdProjects.length

    if (projectsChecked === 0) {
      console.log('[Auto-Activation Job] No CREATED projects found')

      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()

      return {
        success: true,
        startedAt: startTime,
        completedAt: endTime,
        durationMs,
        projectsChecked: 0,
        projectsActivated: 0,
        activatedProjects: [],
        failedProvisioning: 0,
      }
    }

    console.log(`[Auto-Activation Job] Found ${projectsChecked} CREATED projects`)

    const activatedProjects: Array<{
      projectId: string
      projectName: string
      activatedAt: Date
    }> = []
    let projectsActivated = 0
    let failedProvisioning = 0

    // Step 2: Check each project's provisioning status
    for (const project of createdProjects) {
      try {
        const projectId = project.id
        const projectName = project.project_name

        // Get all provisioning steps for this project
        const provisioningSteps = await getAllSteps(pool, projectId)

        if (provisioningSteps.length === 0) {
          console.log(`[Auto-Activation Job] Project ${projectName} (${projectId}): No provisioning steps found, skipping`)
          continue
        }

        // Check if provisioning is complete
        if (isProvisioningComplete(provisioningSteps)) {
          console.log(`[Auto-Activation Job] Project ${projectName} (${projectId}): Provisioning complete, activating...`)

          // Verify transition is valid (CREATED → ACTIVE)
          if (!isValidTransition(ProjectStatus.CREATED, ProjectStatus.ACTIVE)) {
            console.error(`[Auto-Activation Job] Invalid transition: CREATED → ACTIVE`)
            continue
          }

          // Activate the project
          await pool.query(
            `
            UPDATE control_plane.projects
            SET status = 'active', updated_at = NOW()
            WHERE id = $1
            `,
            [projectId]
          )

          const activatedAt = new Date()
          projectsActivated++

          activatedProjects.push({
            projectId,
            projectName,
            activatedAt,
          })

          console.log(`[Auto-Activation Job] ✓ Activated project ${projectName} (${projectId})`)

          // Log activation to audit log
          await logProjectAction.updated(
            systemActor(),
            projectId,
            {
              action: 'auto_activated',
              previous_status: 'created',
              new_status: 'active',
              reason: 'Provisioning completed successfully',
            },
            {
              request: {
                ip: 'system',
                userAgent: 'auto-activation-job',
              },
            }
          ).catch((error) => {
            // Don't fail the job if logging fails
            console.error(`[Auto-Activation Job] Failed to log activation for ${projectId}:`, error)
          })
        } else if (hasProvisioningFailed(provisioningSteps)) {
          console.log(`[Auto-Activation Job] Project ${projectName} (${projectId}): Provisioning failed, skipping`)
          failedProvisioning++
        } else {
          // Provisioning is still in progress
          const progress = Math.round(
            (provisioningSteps.filter((s) => s.status === 'success' || s.status === 'skipped').length /
              provisioningSteps.length) *
              100
          )
          console.log(
            `[Auto-Activation Job] Project ${projectName} (${projectId}): Provisioning in progress (${progress}%), skipping`
          )
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Auto-Activation Job] Error processing project ${project.project_name}:`, errorMessage)
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log('[Auto-Activation Job] Completed')
    console.log(`[Auto-Activation Job] Duration: ${durationMs}ms`)
    console.log(`[Auto-Activation Job] Projects checked: ${projectsChecked}`)
    console.log(`[Auto-Activation Job] Projects activated: ${projectsActivated}`)
    console.log(`[Auto-Activation Job] Failed provisioning: ${failedProvisioning}`)

    if (activatedProjects.length > 0) {
      console.log('[Auto-Activation Job] Activated projects:')
      activatedProjects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.projectName} (${project.projectId})`)
      })
    }

    console.log('='.repeat(60))

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      projectsActivated,
      activatedProjects,
      failedProvisioning,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error('[Auto-Activation Job] Failed')
    console.error(`[Auto-Activation Job] Duration: ${durationMs}ms`)
    console.error(`[Auto-Activation Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      projectsActivated: 0,
      activatedProjects: [],
      failedProvisioning: 0,
      error: errorMessage,
    }
  }
}

/**
 * Get projects that are ready for activation
 *
 * This is useful for monitoring and dashboards to show which projects
 * will be auto-activated.
 *
 * @returns Array of projects with complete provisioning but still in CREATED status
 */
export async function getProjectsReadyForActivation(): Promise<
  Array<{
    projectId: string
    projectName: string
    ownerName: string
    createdAt: Date
  }>
> {
  const pool = getPool()

  try {
    // This query finds projects that:
    // 1. Are in CREATED status
    // 2. Have all provisioning steps completed (success or skipped)
    const result = await pool.query(`
      SELECT DISTINCT
        p.id as project_id,
        p.name as project_name,
        u.name as owner_name,
        p.created_at
      FROM control_plane.projects p
      INNER JOIN control_plane.users u ON p.owner_id = u.id
      WHERE p.status = 'created'
        AND NOT EXISTS (
          SELECT 1 FROM provisioning_steps ps
          WHERE ps.project_id = p.id
          AND ps.status NOT IN ('success', 'skipped')
        )
      ORDER BY p.created_at ASC
    `)

    return result.rows.map((row: any) => ({
      projectId: row.project_id,
      projectName: row.project_name,
      ownerName: row.owner_name,
      createdAt: new Date(row.created_at),
    }))
  } catch (error) {
    console.error('[Auto-Activation Job] Error getting projects ready for activation:', error)
    return []
  }
}

/**
 * Auto-Activation Job Module - Main Job
 */

import { getPool } from '@/lib/db'
import { logProjectAction, systemActor } from '@nextmavenspacks/audit-logs-database'
import { ProjectStatus, isValidTransition } from '@/lib/types/project-lifecycle.types'
import {
  getAllSteps,
  isProvisioningComplete,
  hasProvisioningFailed,
} from '@/lib/provisioning/state-machine'
import type { AutoActivationJobResult } from './types'
import {
  LOG_PREFIXES,
  AUDIT_METADATA,
  SYSTEM_REQUEST,
} from './constants'
import { getCreatedProjects, activateProject } from './queries'

/**
 * Calculate provisioning progress percentage
 */
function calculateProgress(provisioningSteps: any[]): number {
  if (provisioningSteps.length === 0) return 0
  return Math.round(
    (provisioningSteps.filter((s) => s.status === 'success' || s.status === 'skipped').length /
      provisioningSteps.length) *
      100
  )
}

/**
 * Process a single project for auto-activation
 */
async function processProject(
  project: any,
  pool: any
): Promise<{ activated: boolean; failed: boolean; activatedAt?: Date }> {
  const projectId = project.id
  const projectName = project.project_name

  // Get all provisioning steps for this project
  const provisioningSteps = await getAllSteps(pool, projectId)

  if (provisioningSteps.length === 0) {
    console.log(`${LOG_PREFIXES.NO_STEPS} ${projectName} (${projectId}): ${LOG_PREFIXES.NO_STEPS_MSG}`)
    return { activated: false, failed: false }
  }

  // Check if provisioning is complete
  if (isProvisioningComplete(provisioningSteps)) {
    console.log(`${LOG_PREFIXES.COMPLETE} ${projectName} (${projectId}): ${LOG_PREFIXES.COMPLETE_MSG}`)

    // Verify transition is valid (CREATED → ACTIVE)
    if (!isValidTransition(ProjectStatus.CREATED, ProjectStatus.ACTIVE)) {
      console.error(LOG_PREFIXES.INVALID_TRANSITION)
      return { activated: false, failed: false }
    }

    // Activate the project
    await activateProject(projectId)

    const activatedAt = new Date()

    console.log(`${LOG_PREFIXES.ACTIVATED} ${projectName} (${projectId})`)

    // Log activation to audit log
    await logProjectAction.updated(
      systemActor(),
      projectId,
      AUDIT_METADATA,
      { request: SYSTEM_REQUEST }
    ).catch((error) => {
      // Don't fail the job if logging fails
      console.error(`${LOG_PREFIXES.LOG_FAILED} ${projectId}:`, error)
    })

    return { activated: true, failed: false, activatedAt }
  } else if (hasProvisioningFailed(provisioningSteps)) {
    console.log(`${LOG_PREFIXES.FAILED} ${projectName} (${projectId}): ${LOG_PREFIXES.FAILED_MSG}`)
    return { activated: false, failed: true }
  } else {
    // Provisioning is still in progress
    const progress = calculateProgress(provisioningSteps)
    console.log(
      `${LOG_PREFIXES.IN_PROGRESS} ${projectName} (${projectId}): ${LOG_PREFIXES.IN_PROGRESS_MSG} (${progress}%), skipping`
    )
    return { activated: false, failed: false }
  }
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

  console.log(LOG_PREFIXES.HEADER)
  console.log(`${LOG_PREFIXES.START} Started at ${startTime.toISOString()}`)
  console.log(LOG_PREFIXES.HEADER)

  try {
    // Step 1: Find all projects in CREATED status
    const createdProjects = await getCreatedProjects()
    const projectsChecked = createdProjects.length

    if (projectsChecked === 0) {
      console.log(LOG_PREFIXES.NO_PROJECTS)

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

    console.log(`${LOG_PREFIXES.FOUND_PROJECTS} ${projectsChecked} ${LOG_PREFIXES.CREATED_PROJECTS}`)

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
        const result = await processProject(project, getPool())

        if (result.activated && result.activatedAt) {
          projectsActivated++
          activatedProjects.push({
            projectId: project.id,
            projectName: project.project_name,
            activatedAt: result.activatedAt,
          })
        }

        if (result.failed) {
          failedProvisioning++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`${LOG_PREFIXES.ERROR_PROCESSING} ${project.project_name}:`, errorMessage)
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log(LOG_PREFIXES.HEADER)
    console.log(LOG_PREFIXES.JOB_COMPLETE)
    console.log(`${LOG_PREFIXES.DURATION} ${durationMs}ms`)
    console.log(`${LOG_PREFIXES.PROJECTS_CHECKED} ${projectsChecked}`)
    console.log(`${LOG_PREFIXES.PROJECTS_ACTIVATED} ${projectsActivated}`)
    console.log(`${LOG_PREFIXES.FAILED_PROVISIONING} ${failedProvisioning}`)

    if (activatedProjects.length > 0) {
      console.log(LOG_PREFIXES.ACTIVATED_PROJECTS)
      activatedProjects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.projectName} (${project.projectId})`)
      })
    }

    console.log(LOG_PREFIXES.HEADER)

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

    console.error(LOG_PREFIXES.HEADER)
    console.error(LOG_PREFIXES.JOB_FAILED)
    console.error(`${LOG_PREFIXES.DURATION} ${durationMs}ms`)
    console.error(`${LOG_PREFIXES.START} Error: ${errorMessage}`)
    console.error(LOG_PREFIXES.HEADER)

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

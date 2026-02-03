/**
 * Grace Period Background Job
 *
 * Provides the library function for managing deleted projects during their grace period.
 * This is designed to be called by a cron job or scheduler (daily).
 *
 * US-008: Implement 30-Day Grace Period
 * US-011: Implement Hard Delete After Grace Period
 *
 * @deprecated This file has been refactored into the grace-period-job-module.
 * Please import from './grace-period-job-module' instead.
 */

import { getPool } from '@/lib/db'
import type { GracePeriodJobResult } from './grace-period-job-module/types'
import {
  logJobStart,
  logNoProjects,
  logProjectsFound,
  logCategorizationResults,
  logJobComplete,
  logProjectsNeedingNotification,
  logHardDeletedProjects,
  logJobEnd,
  logJobError,
} from './grace-period-job-module/logger'
import { findProjectsInGracePeriod } from './grace-period-job-module/db'
import { categorizeProjects } from './grace-period-job-module/utils'
import { hardDeleteProject } from './grace-period-job-module/hard-delete'

export * from './grace-period-job-module'

/**
 * Run the grace period background job
 */
export async function runGracePeriodJob(): Promise<GracePeriodJobResult> {
  const startTime = new Date()
  logJobStart(startTime)

  const pool = getPool()

  try {
    const projects = await findProjectsInGracePeriod(pool)
    const projectsChecked = projects.length

    if (projectsChecked === 0) {
      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      logNoProjects(durationMs)

      return {
        success: true,
        startedAt: startTime,
        completedAt: endTime,
        durationMs,
        projectsChecked: 0,
        projectsNearExpiration: [],
        projectsHardDeleted: [],
        projectsNeedingNotification: [],
      }
    }

    logProjectsFound(projectsChecked)

    const { projectsNearExpiration, projectsNeedingNotification, projectsToHardDelete } = categorizeProjects(projects)
    logCategorizationResults(projectsNearExpiration.length, projectsToHardDelete.length)

    // Hard delete projects whose grace period has ended
    const hardDeletedProjects: typeof projectsToHardDelete = []

    for (const project of projectsToHardDelete) {
      try {
        await hardDeleteProject(pool, project)
        hardDeletedProjects.push(project)
      } catch (error) {
        // Error logged in hardDeleteProject
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    logJobComplete({
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      projectsNearExpiration,
      projectsHardDeleted: hardDeletedProjects,
      projectsNeedingNotification,
    })

    logProjectsNeedingNotification(projectsNeedingNotification)
    logHardDeletedProjects(hardDeletedProjects)
    logJobEnd()

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      projectsNearExpiration,
      projectsHardDeleted: hardDeletedProjects,
      projectsNeedingNotification,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logJobError(error as Error, durationMs)

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      projectsNearExpiration: [],
      projectsHardDeleted: [],
      projectsNeedingNotification: [],
      error: errorMessage,
    }
  }
}

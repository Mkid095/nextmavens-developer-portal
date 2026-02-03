/**
 * Grace Period Job - Module - Logger
 */

import type { GracePeriodJobResult, ProjectNearExpiration, ProjectToHardDelete } from '../types'
import { LOG_SEPARATOR, LOG_MESSAGES } from './constants'

export function logJobStart(startTime: Date): void {
  console.log(LOG_SEPARATOR)
  console.log(LOG_MESSAGES.JOB_START(startTime))
  console.log(LOG_SEPARATOR)
}

export function logNoProjects(durationMs: number): void {
  console.log(LOG_SEPARATOR)
  console.log(LOG_MESSAGES.NO_PROJECTS)
  console.log(LOG_MESSAGES.JOB_DURATION(durationMs))
  console.log(LOG_SEPARATOR)
}

export function logProjectsFound(count: number): void {
  console.log(LOG_MESSAGES.PROJECTS_FOUND(count))
}

export function logCategorizationResults(nearExpiration: number, toHardDelete: number): void {
  console.log(LOG_MESSAGES.PROJECTS_NEAR_EXPIRATION(nearExpiration))
  console.log(LOG_MESSAGES.PROJECTS_TO_DELETE(toHardDelete))
}

export function logJobComplete(result: Omit<GracePeriodJobResult, 'projectsNearExpiration'>): void {
  console.log(LOG_SEPARATOR)
  console.log(LOG_MESSAGES.JOB_COMPLETE)
  console.log(LOG_MESSAGES.JOB_DURATION(result.durationMs))
  console.log(LOG_MESSAGES.PROJECTS_CHECKED(result.projectsChecked))
  console.log(LOG_MESSAGES.PROJECTS_NEEDING_NOTIFICATION(result.projectsNeedingNotification.length))
  console.log(LOG_MESSAGES.PROJECTS_HARD_DELETED(result.projectsHardDeleted.length))
}

export function logProjectsNeedingNotification(projects: ProjectNearExpiration[]): void {
  if (projects.length === 0) return

  console.log(LOG_MESSAGES.PROJECT_WARNING_HEADER)
  projects.forEach((project, index) => {
    console.log(
      LOG_MESSAGES.PROJECT_WARNING_ITEM(
        index,
        project.projectName,
        project.projectSlug,
        project.daysUntilHardDelete
      )
    )
  })
}

export function logHardDeletedProjects(projects: ProjectToHardDelete[]): void {
  if (projects.length === 0) return

  console.log(LOG_MESSAGES.PROJECT_DELETED_HEADER)
  projects.forEach((project, index) => {
    console.log(
      LOG_MESSAGES.PROJECT_DELETED_ITEM(
        index,
        project.projectName,
        project.projectSlug,
        project.daysPastGracePeriod
      )
    )
  })
}

export function logJobEnd(): void {
  console.log(LOG_SEPARATOR)
}

export function logJobError(error: Error, durationMs: number): void {
  console.error(LOG_SEPARATOR)
  console.error(LOG_MESSAGES.JOB_FAILED)
  console.error(LOG_MESSAGES.JOB_DURATION(durationMs))
  console.error(LOG_MESSAGES.ERROR(error.message))
  console.error(LOG_SEPARATOR)
}

export function logHardDeletedProject(project: ProjectToHardDelete): void {
  console.log(LOG_MESSAGES.HARD_DELETED_PROJECT(project.projectId, project.projectName))
}

export function logHardDeleteFailed(projectId: string, error: unknown): void {
  console.error(LOG_MESSAGES.HARD_DELETE_FAILED(projectId), error)
}

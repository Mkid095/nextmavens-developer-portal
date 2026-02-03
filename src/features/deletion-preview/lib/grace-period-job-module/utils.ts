/**
 * Grace Period Job - Module - Utilities
 */

import type { ProjectRecord, ProjectNearExpiration, ProjectToHardDelete, ProjectCategorization } from '../types'
import { WARNING_DAYS_BEFORE } from './constants'

export function calculateDaysUntil(now: Date, gracePeriodEnd: Date): {
  daysUntilEnd: number
  daysPastEnd: number
} {
  const daysUntilEnd = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const daysPastEnd = Math.floor((now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))
  return { daysUntilEnd, daysPastEnd }
}

export function categorizeProject(
  project: ProjectRecord,
  now: Date
): { type: 'near_expiration' | 'to_hard_delete' | 'none'; data?: ProjectNearExpiration | ProjectToHardDelete } {
  const gracePeriodEnd = new Date(project.grace_period_ends_at)
  const { daysUntilEnd, daysPastEnd } = calculateDaysUntil(now, gracePeriodEnd)

  if (gracePeriodEnd < now) {
    return {
      type: 'to_hard_delete',
      data: {
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        tenantId: project.tenant_id,
        gracePeriodEndsAt: gracePeriodEnd,
        daysPastGracePeriod: daysPastEnd,
      },
    }
  }

  if (daysUntilEnd <= WARNING_DAYS_BEFORE && daysUntilEnd > 0) {
    return {
      type: 'near_expiration',
      data: {
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        tenantId: project.tenant_id,
        gracePeriodEndsAt: gracePeriodEnd,
        daysUntilHardDelete: daysUntilEnd,
      },
    }
  }

  return { type: 'none' }
}

export function categorizeProjects(projects: ProjectRecord[]): ProjectCategorization {
  const now = new Date()
  const projectsNearExpiration: ProjectNearExpiration[] = []
  const projectsNeedingNotification: ProjectNearExpiration[] = []
  const projectsToHardDelete: ProjectToHardDelete[] = []

  for (const project of projects) {
    const result = categorizeProject(project, now)

    if (result.type === 'to_hard_delete' && result.data) {
      projectsToHardDelete.push(result.data as ProjectToHardDelete)
    } else if (result.type === 'near_expiration' && result.data) {
      projectsNearExpiration.push(result.data)
      projectsNeedingNotification.push(result.data)
    }
  }

  return {
    projectsNearExpiration,
    projectsNeedingNotification,
    projectsToHardDelete,
  }
}

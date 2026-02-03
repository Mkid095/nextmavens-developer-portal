/**
 * Grace Period Job - Module - Types
 */

export interface ProjectNearExpiration {
  projectId: string
  projectName: string
  projectSlug: string
  tenantId: string
  gracePeriodEndsAt: Date
  daysUntilHardDelete: number
}

export interface ProjectToHardDelete {
  projectId: string
  projectName: string
  projectSlug: string
  tenantId: string
  gracePeriodEndsAt: Date
  daysPastGracePeriod: number
}

export interface GracePeriodJobResult {
  success: boolean
  startedAt: Date
  completedAt: Date
  durationMs: number
  projectsChecked: number
  projectsNearExpiration: ProjectNearExpiration[]
  projectsHardDeleted: ProjectToHardDelete[]
  projectsNeedingNotification: ProjectNearExpiration[]
  error?: string
}

export interface ProjectRecord {
  id: string
  name: string
  slug: string
  tenant_id: string
  deletion_scheduled_at: Date
  grace_period_ends_at: Date
}

export interface ProjectCategorization {
  projectsNearExpiration: ProjectNearExpiration[]
  projectsNeedingNotification: ProjectNearExpiration[]
  projectsToHardDelete: ProjectToHardDelete[]
}

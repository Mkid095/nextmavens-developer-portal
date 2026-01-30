/**
 * Grace Period Background Job
 *
 * Provides the library function for managing deleted projects during their grace period.
 * This is designed to be called by a cron job or scheduler (daily).
 *
 * Usage:
 * - Call runGracePeriodJob() from a cron job (e.g., every day)
 * - The function will:
 *   1. Check for projects approaching 7-day warning threshold
 *   2. Check for projects with expired grace periods
 *   3. Hard delete projects whose grace period has ended
 * - Results are logged for monitoring and debugging
 *
 * US-008: Implement 30-Day Grace Period
 * US-011: Implement Hard Delete After Grace Period
 */

import { getPool } from '@/lib/db'

/**
 * Project approaching grace period end
 */
export interface ProjectNearExpiration {
  projectId: string
  projectName: string
  projectSlug: string
  tenantId: string
  gracePeriodEndsAt: Date
  daysUntilHardDelete: number
}

/**
 * Project to be hard deleted
 */
export interface ProjectToHardDelete {
  projectId: string
  projectName: string
  projectSlug: string
  tenantId: string
  gracePeriodEndsAt: Date
  daysPastGracePeriod: number
}

/**
 * Background job result interface
 */
export interface GracePeriodJobResult {
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
  /** Projects approaching 7-day warning threshold */
  projectsNearExpiration: ProjectNearExpiration[]
  /** Projects that were hard deleted */
  projectsHardDeleted: ProjectToHardDelete[]
  /** Projects that need notifications (7-day warning) */
  projectsNeedingNotification: ProjectNearExpiration[]
  /** Error message if job failed */
  error?: string
}

/**
 * Number of days before grace period ends to send warning notification
 */
const WARNING_DAYS_BEFORE = 7

/**
 * Run the grace period background job
 *
 * This function:
 * 1. Finds projects whose grace period will end in ~7 days (sends warning)
 * 2. Finds projects whose grace period has ended (hard deletes them)
 *
 * Hard deletion includes:
 * - Dropping the tenant schema
 * - Deleting all related records (api_keys, webhooks, edge_functions, storage_buckets, secrets)
 * - Deleting the project row
 * - Setting deleted_at timestamp
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runGracePeriodJob();
 * console.log(`Job completed: ${result.projectsHardDeleted.length} projects hard deleted`);
 */
export async function runGracePeriodJob(): Promise<GracePeriodJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Grace Period Job] Started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  const pool = getPool()

  try {
    // Find all projects in deletion state (status = 'DELETED')
    const projectsResult = await pool.query(`
      SELECT id, name, slug, tenant_id, deletion_scheduled_at, grace_period_ends_at
      FROM control_plane.projects
      WHERE status = 'DELETED'
        AND deletion_scheduled_at IS NOT NULL
        AND grace_period_ends_at IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY grace_period_ends_at ASC
    `)

    const projects = projectsResult.rows
    const projectsChecked = projects.length

    if (projectsChecked === 0) {
      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()

      console.log('='.repeat(60))
      console.log(`[Grace Period Job] Completed - No projects in grace period`)
      console.log(`[Grace Period Job] Duration: ${durationMs}ms`)
      console.log('='.repeat(60))

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

    console.log(`[Grace Period Job] Found ${projectsChecked} projects in grace period`)

    // Calculate dates for warning and hard delete
    const now = new Date()
    const warningThreshold = new Date(now)
    warningThreshold.setDate(warningThreshold.getDate() + WARNING_DAYS_BEFORE)

    const projectsNearExpiration: ProjectNearExpiration[] = []
    const projectsNeedingNotification: ProjectNearExpiration[] = []
    const projectsToHardDelete: ProjectToHardDelete[] = []

    // Categorize projects
    for (const project of projects) {
      const gracePeriodEnd = new Date(project.grace_period_ends_at)
      const daysUntilEnd = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const daysPastEnd = Math.floor((now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))

      if (gracePeriodEnd < now) {
        // Grace period has ended - mark for hard delete
        projectsToHardDelete.push({
          projectId: project.id,
          projectName: project.name,
          projectSlug: project.slug,
          tenantId: project.tenant_id,
          gracePeriodEndsAt: gracePeriodEnd,
          daysPastGracePeriod: daysPastEnd,
        })
      } else if (daysUntilEnd <= WARNING_DAYS_BEFORE && daysUntilEnd > 0) {
        // Approaching warning threshold
        const nearExp: ProjectNearExpiration = {
          projectId: project.id,
          projectName: project.name,
          projectSlug: project.slug,
          tenantId: project.tenant_id,
          gracePeriodEndsAt: gracePeriodEnd,
          daysUntilHardDelete: daysUntilEnd,
        }
        projectsNearExpiration.push(nearExp)
        projectsNeedingNotification.push(nearExp)
      }
    }

    console.log(`[Grace Period Job] Projects near expiration: ${projectsNearExpiration.length}`)
    console.log(`[Grace Period Job] Projects to hard delete: ${projectsToHardDelete.length}`)

    // Hard delete projects whose grace period has ended
    const hardDeletedProjects: ProjectToHardDelete[] = []

    for (const project of projectsToHardDelete) {
      try {
        await hardDeleteProject(pool, project)
        hardDeletedProjects.push(project)
        console.log(`[Grace Period Job] Hard deleted project ${project.projectId} (${project.projectName})`)
      } catch (error) {
        console.error(`[Grace Period Job] Failed to hard delete project ${project.projectId}:`, error)
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log(`[Grace Period Job] Completed`)
    console.log(`[Grace Period Job] Duration: ${durationMs}ms`)
    console.log(`[Grace Period Job] Projects checked: ${projectsChecked}`)
    console.log(`[Grace Period Job] Projects needing notification: ${projectsNeedingNotification.length}`)
    console.log(`[Grace Period Job] Projects hard deleted: ${hardDeletedProjects.length}`)

    if (projectsNeedingNotification.length > 0) {
      console.log(`[Grace Period Job] Projects needing 7-day warning:`)
      projectsNeedingNotification.forEach((project, index) => {
        console.log(
          `  ${index + 1}. ${project.projectName} (${project.projectSlug}) - ${project.daysUntilHardDelete} days until hard delete`
        )
      })
    }

    if (hardDeletedProjects.length > 0) {
      console.log(`[Grace Period Job] Hard deleted projects:`)
      hardDeletedProjects.forEach((project, index) => {
        console.log(
          `  ${index + 1}. ${project.projectName} (${project.projectSlug}) - ${project.daysPastGracePeriod} days past grace period`
        )
      })
    }

    console.log('='.repeat(60))

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

    console.error('='.repeat(60))
    console.error(`[Grace Period Job] Failed`)
    console.error(`[Grace Period Job] Duration: ${durationMs}ms`)
    console.error(`[Grace Period Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

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

/**
 * Hard delete a project
 *
 * This performs the actual hard deletion:
 * 1. Drops the tenant schema (if exists)
 * 2. Deletes all related records from control_plane schema
 * 3. Sets deleted_at timestamp on project
 *
 * @param pool - Database pool
 * @param project - Project to hard delete
 */
async function hardDeleteProject(
  pool: any,
  project: ProjectToHardDelete
): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { projectId, projectSlug } = project

    // 1. Drop the tenant schema if it exists
    const tenantSchema = `tenant_${projectSlug}`
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${tenantSchema} CASCADE`)
      console.log(`[Hard Delete] Dropped schema ${tenantSchema}`)
    } catch (error) {
      console.warn(`[Hard Delete] Could not drop schema ${tenantSchema}:`, error)
    }

    // 2. Delete related records from control_plane schema
    // Delete API keys
    await client.query(`DELETE FROM control_plane.api_keys WHERE project_id = $1`, [projectId])
    console.log(`[Hard Delete] Deleted API keys for project ${projectId}`)

    // Delete webhooks
    await client.query(`DELETE FROM control_plane.webhooks WHERE project_id = $1`, [projectId])
    console.log(`[Hard Delete] Deleted webhooks for project ${projectId}`)

    // Delete edge functions
    await client.query(`DELETE FROM control_plane.edge_functions WHERE project_id = $1`, [projectId])
    console.log(`[Hard Delete] Deleted edge functions for project ${projectId}`)

    // Delete storage buckets
    await client.query(`DELETE FROM control_plane.storage_buckets WHERE project_id = $1`, [projectId])
    console.log(`[Hard Delete] Deleted storage buckets for project ${projectId}`)

    // Delete secrets
    await client.query(`DELETE FROM control_plane.secrets WHERE project_id = $1`, [projectId])
    console.log(`[Hard Delete] Deleted secrets for project ${projectId}`)

    // 3. Set deleted_at timestamp on project
    await client.query(
      `UPDATE control_plane.projects
       SET deleted_at = NOW()
       WHERE id = $1`,
      [projectId]
    )
    console.log(`[Hard Delete] Set deleted_at for project ${projectId}`)

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

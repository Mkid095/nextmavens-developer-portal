/**
 * Suspension Library
 *
 * Manages project suspensions due to hard cap violations.
 * Provides functions to suspend, unsuspend, and check suspension status.
 */

import { getPool } from '@/lib/db'
import { HardCapType, SuspensionType } from '../types'
import type { SuspensionReason, SuspensionRecord } from '../types'
import { getCurrentUsage, checkQuota } from './enforcement'
import { getProjectQuota } from './quotas'
import { sendSuspensionNotification } from './notifications'
import { logProjectAction } from '@nextmavenspacks/audit-logs-database'
import { invalidateSnapshot } from '@/lib/snapshot'
import { getEnvironmentConfig, type Environment } from '@/lib/environment'

/**
 * Suspend a project due to cap violation
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * @param projectId - The project to suspend
 * @param reason - Details about why the project is being suspended
 * @param notes - Optional notes about the suspension
 * @param suspensionType - Type of suspension (manual or automatic). Default: manual
 */
export async function suspendProject(
  projectId: string,
  reason: SuspensionReason,
  notes?: string,
  suspensionType: SuspensionType = SuspensionType.MANUAL
): Promise<void> {
  const pool = getPool()

  try {
    // Start a transaction for atomicity
    await pool.query('BEGIN')

    try {
      // Get project and organization details for notification
      const projectResult = await pool.query(
        `
        SELECT p.project_name, o.name as org_name
        FROM projects p
        JOIN organizations o ON p.org_id = o.id
        WHERE p.id = $1
        `,
        [projectId]
      )

      const projectName = projectResult.rows[0]?.project_name || 'Unknown Project'
      const orgName = projectResult.rows[0]?.org_name || 'Unknown Organization'

      // Check if project is already suspended
      const existingSuspension = await pool.query(
        `
        SELECT id FROM suspensions
        WHERE project_id = $1 AND resolved_at IS NULL
        `,
        [projectId]
      )

      if (existingSuspension.rows.length > 0) {
        console.log(`[Suspensions] Project ${projectId} is already suspended`)
        await pool.query('ROLLBACK')
        return
      }

      // Insert suspension record
      await pool.query(
        `
        INSERT INTO suspensions (project_id, reason, cap_exceeded, notes, suspension_type)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [projectId, JSON.stringify(reason), reason.cap_type, notes || null, suspensionType]
      )

      // Add to suspension history
      await pool.query(
        `
        INSERT INTO suspension_history (project_id, action, reason, notes)
        VALUES ($1, 'suspended', $2, $3)
        `,
        [projectId, JSON.stringify(reason), notes || null]
      )

      // Update project status to suspended
      await pool.query(
        `
        UPDATE projects
        SET status = 'suspended'
        WHERE id = $1
        `,
        [projectId]
      )

      await pool.query('COMMIT')

      console.log(
        `[Suspensions] Suspended project ${projectId} for exceeding ${reason.cap_type}`
      )

      // Invalidate snapshot cache for this project
      invalidateSnapshot(projectId)

      // Log to audit logs (non-blocking)
      logProjectAction.autoSuspended(
        projectId,
        `Auto-suspended for exceeding ${reason.cap_type}`,
        true,
        {
          metadata: {
            cap_type: reason.cap_type,
            current_value: reason.current_value,
            limit_exceeded: reason.limit_exceeded,
            details: reason.details,
          },
        }
      ).catch((error) => {
        console.error('[Suspensions] Failed to log to audit logs:', error)
      })

      // Send suspension notification (non-blocking)
      sendSuspensionNotification(projectId, projectName, orgName, reason, new Date())
        .then((results) => {
          const successful = results.filter((r) => r.success).length
          console.log(
            `[Suspensions] Sent ${successful}/${results.length} suspension notifications for project ${projectId}`
          )
        })
        .catch((error) => {
          console.error(
            `[Suspensions] Failed to send suspension notification for project ${projectId}:`,
            error
          )
        })
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('[Suspensions] Error suspending project:', error)
    throw new Error('Failed to suspend project')
  }
}

/**
 * Unsuspend a project (resolve the suspension)
 *
 * @param projectId - The project to unsuspend
 * @param notes - Optional notes about the resolution
 */
export async function unsuspendProject(
  projectId: string,
  notes?: string
): Promise<void> {
  const pool = getPool()

  try {
    // Start a transaction for atomicity
    await pool.query('BEGIN')

    try {
      // Check if project has an active suspension
      const suspensionResult = await pool.query(
        `
        SELECT id, reason, cap_exceeded
        FROM suspensions
        WHERE project_id = $1 AND resolved_at IS NULL
        `,
        [projectId]
      )

      if (suspensionResult.rows.length === 0) {
        console.log(`[Suspensions] Project ${projectId} is not suspended`)
        await pool.query('ROLLBACK')
        return
      }

      const suspension = suspensionResult.rows[0]

      // Mark suspension as resolved
      await pool.query(
        `
        UPDATE suspensions
        SET resolved_at = NOW()
        WHERE project_id = $1 AND resolved_at IS NULL
        `,
        [projectId]
      )

      // Add to suspension history
      await pool.query(
        `
        INSERT INTO suspension_history (project_id, action, reason, notes)
        VALUES ($1, 'unsuspended', $2, $3)
        `,
        [projectId, suspension.reason, notes || null]
      )

      // Update project status back to active
      await pool.query(
        `
        UPDATE projects
        SET status = 'active'
        WHERE id = $1
        `,
        [projectId]
      )

      await pool.query('COMMIT')

      console.log(`[Suspensions] Unsuspended project ${projectId}`)

      // Invalidate snapshot cache for this project
      invalidateSnapshot(projectId)
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('[Suspensions] Error unsuspending project:', error)
    throw new Error('Failed to unsuspend project')
  }
}

/**
 * Get the suspension status of a project
 *
 * @param projectId - The project to check
 * @returns The suspension record if suspended, null otherwise
 */
export async function getSuspensionStatus(
  projectId: string
): Promise<SuspensionRecord | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        reason,
        cap_exceeded,
        suspended_at,
        resolved_at,
        notes,
        suspension_type
      FROM suspensions
      WHERE project_id = $1 AND resolved_at IS NULL
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]

    return {
      id: row.id,
      project_id: row.project_id,
      reason: row.reason as SuspensionReason,
      cap_exceeded: row.cap_exceeded as HardCapType,
      suspended_at: row.suspended_at,
      resolved_at: row.resolved_at,
      notes: row.notes,
      suspension_type: row.suspension_type as SuspensionType,
    }
  } catch (error) {
    console.error('[Suspensions] Error getting suspension status:', error)
    throw new Error('Failed to get suspension status')
  }
}

/**
 * Check if a specific cap is exceeded for a project
 *
 * @param projectId - The project to check
 * @param capType - The cap type to check
 * @returns True if the cap is exceeded, false otherwise
 */
export async function isCapExceeded(
  projectId: string,
  capType: HardCapType
): Promise<boolean> {
  try {
    const currentUsage = await getCurrentUsage(projectId, capType)
    const check = await checkQuota(projectId, capType, currentUsage)

    return !check.allowed
  } catch (error) {
    console.error('[Suspensions] Error checking if cap exceeded:', error)
    // On error, assume not exceeded to avoid false suspensions
    return false
  }
}

/**
 * Check all projects for cap violations and suspend those exceeding limits
 *
 * This function is designed to be called by a background job/cron.
 * It iterates through all projects and checks each against their configured caps.
 *
 * US-005: Skip auto-suspend for dev and staging environments based on environment config
 *
 * @returns Array of suspension records for newly suspended projects
 */
export async function checkAllProjectsForSuspension(): Promise<
  SuspensionRecord[]
> {
  const pool = getPool()

  try {
    console.log('[Suspensions] Starting cap violation check for all projects')

    // Get all active projects with their environment
    const projectsResult = await pool.query(
      `
      SELECT id, project_name, environment
      FROM projects
      WHERE status = 'active'
      `
    )

    const projects = projectsResult.rows
    console.log(`[Suspensions] Checking ${projects.length} active projects`)

    const newlySuspended: SuspensionRecord[] = []
    let suspensionsMade = 0
    let skippedForEnvironment = 0

    // Check each project for cap violations
    for (const project of projects) {
      const projectId = project.id
      const projectEnv = (project.environment || 'prod') as Environment

      // Get environment config to check if auto-suspend is enabled
      const envConfig = getEnvironmentConfig(projectEnv)

      // Skip auto-suspend for dev and staging environments
      if (!envConfig.auto_suspend_enabled) {
        console.log(
          `[Suspensions] Skipping project ${projectId} in ${projectEnv} environment (auto-suspend disabled)`
        )
        skippedForEnvironment++
        continue
      }

      try {
        // Check all cap types for this project
        const capTypes = Object.values(HardCapType)

        for (const capType of capTypes) {
          const exceeded = await isCapExceeded(projectId, capType)

          if (exceeded) {
            // Get the quota details for the suspension reason
            const quota = await getProjectQuota(projectId, capType)
            const currentUsage = await getCurrentUsage(projectId, capType)

            const reason: SuspensionReason = {
              cap_type: capType,
              current_value: currentUsage,
              limit_exceeded: quota?.cap_value || 0,
              details: `Project exceeded ${capType} limit`,
            }

            // Suspend the project with automatic suspension type
            await suspendProject(
              projectId,
              reason,
              'Auto-suspended by background job',
              SuspensionType.AUTOMATIC
            )

            // Get the suspension record
            const suspension = await getSuspensionStatus(projectId)

            if (suspension) {
              newlySuspended.push(suspension)
              suspensionsMade++
            }

            // Break out of cap type loop since project is now suspended
            break
          }
        }
      } catch (error) {
        console.error(
          `[Suspensions] Error checking project ${projectId}:`,
          error
        )
        // Continue with next project
      }
    }

    console.log(
      `[Suspensions] Cap violation check complete. ${suspensionsMade} project(s) suspended. ${skippedForEnvironment} project(s) skipped (dev/staging environment).`
    )

    return newlySuspended
  } catch (error) {
    console.error('[Suspensions] Error checking all projects for suspension:', error)
    throw new Error('Failed to check projects for suspension')
  }
}

/**
 * Get all active suspensions
 *
 * @returns Array of all active suspension records
 */
export async function getAllActiveSuspensions(): Promise<
  SuspensionRecord[]
> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.project_id,
        s.reason,
        s.cap_exceeded,
        s.suspended_at,
        s.resolved_at,
        s.notes,
        s.suspension_type,
        p.project_name
      FROM suspensions s
      JOIN projects p ON s.project_id = p.id
      WHERE s.resolved_at IS NULL
      ORDER BY s.suspended_at DESC
      `
    )

    return result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      reason: row.reason as SuspensionReason,
      cap_exceeded: row.cap_exceeded as HardCapType,
      suspended_at: row.suspended_at,
      resolved_at: row.resolved_at,
      notes: row.notes,
      suspension_type: row.suspension_type as SuspensionType,
    }))
  } catch (error) {
    console.error('[Suspensions] Error getting active suspensions:', error)
    throw new Error('Failed to get active suspensions')
  }
}

/**
 * Get suspension history for a project
 *
 * @param projectId - The project to get history for
 * @returns Array of history entries
 */
export async function getSuspensionHistory(
  projectId: string
): Promise<Array<{ action: string; occurred_at: Date; reason: SuspensionReason }>> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        action,
        occurred_at,
        reason
      FROM suspension_history
      WHERE project_id = $1
      ORDER BY occurred_at DESC
      `,
      [projectId]
    )

    return result.rows.map((row) => ({
      action: row.action,
      occurred_at: row.occurred_at,
      reason: row.reason as SuspensionReason,
    }))
  } catch (error) {
    console.error('[Suspensions] Error getting suspension history:', error)
    throw new Error('Failed to get suspension history')
  }
}

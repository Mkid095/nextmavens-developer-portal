/**
 * Suspensions Module - Suspend/Unsuspend Actions
 */

import { getPool } from '@/lib/db'
import { SuspensionType, type SuspensionReason } from '../../types'
import { sendSuspensionNotification } from '../notifications'
import { logProjectAction } from '@nextmavenspacks/audit-logs-database'
import { invalidateSnapshot } from '@/lib/snapshot'
import * as queries from './queries'
import type { ProjectDetails } from './types'

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
    await pool.query('BEGIN')

    try {
      // Get project and organization details for notification
      const details = await queries.queryProjectDetails(projectId)
      if (!details) {
        throw new Error('Project not found')
      }

      const { projectName, orgName } = details

      // Check if project is already suspended
      const alreadySuspended = await queries.queryExistingSuspension(projectId)
      if (alreadySuspended) {
        console.log(`[Suspensions] Project ${projectId} is already suspended`)
        await pool.query('ROLLBACK')
        return
      }

      // Insert suspension record
      await queries.insertSuspensionRecord(projectId, reason, notes || null, suspensionType)

      // Add to suspension history
      await queries.insertSuspensionHistory(projectId, 'suspended', reason, notes || null)

      // Update project status to suspended
      await queries.updateProjectStatus(projectId, 'suspended')

      await pool.query('COMMIT')

      console.log(
        `[Suspensions] Suspended project ${projectId} for exceeding ${reason.cap_type}`
      )

      // Invalidate snapshot cache
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
    await pool.query('BEGIN')

    try {
      // Check if project has an active suspension
      const suspension = await queries.queryActiveSuspension(projectId)

      if (!suspension) {
        console.log(`[Suspensions] Project ${projectId} is not suspended`)
        await pool.query('ROLLBACK')
        return
      }

      // Mark suspension as resolved
      await queries.resolveSuspension(projectId)

      // Add to suspension history
      await queries.insertSuspensionHistory(projectId, 'unsuspended', suspension.reason, notes || null)

      // Update project status back to active
      await queries.updateProjectStatus(projectId, 'active')

      await pool.query('COMMIT')

      console.log(`[Suspensions] Unsuspended project ${projectId}`)

      // Invalidate snapshot cache
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

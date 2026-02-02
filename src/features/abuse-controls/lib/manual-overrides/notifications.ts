/**
 * Manual Overrides Notifications Module
 *
 * Provides notification and logging functions for manual overrides.
 * Handles audit logging and console notifications.
 */

import { logManualIntervention } from '../audit-logger'
import {
  ManualOverrideAction,
  ProjectStatus,
  HardCapType,
} from '../../types'

/**
 * Log manual override to audit system
 *
 * @param projectId - The project being overridden
 * @param performedBy - User ID of the performer
 * @param action - The action performed
 * @param reason - The reason for the override
 * @param notes - Optional additional notes
 * @param previousStatus - Previous project status
 * @param newStatus - New project status
 * @param previousCaps - Previous cap values
 * @param newCaps - New cap values (if applicable)
 * @param ipAddress - Optional IP address of the performer
 */
export async function logManualOverride(
  projectId: string,
  performedBy: string,
  action: ManualOverrideAction,
  reason: string,
  notes: string | undefined,
  previousStatus: ProjectStatus,
  newStatus: ProjectStatus,
  previousCaps: Record<HardCapType, number>,
  newCaps?: Record<HardCapType, number>,
  ipAddress?: string
): Promise<void> {
  await logManualIntervention(
    projectId,
    performedBy,
    `Manual override: ${action}`,
    {
      action,
      reason,
      notes,
      previous_status: previousStatus,
      new_status: newStatus,
      previous_caps: previousCaps,
      new_caps: newCaps,
      ip_address: ipAddress,
    }
  )
}

/**
 * Log override completion to console
 *
 * @param action - The action performed
 * @param projectId - The project being overridden
 * @param performedBy - User ID of the performer
 */
export function logOverrideCompletion(
  action: ManualOverrideAction,
  projectId: string,
  performedBy: string
): void {
  console.log(
    `[Manual Overrides] Performed ${action} on project ${projectId} by ${performedBy}`
  )
}

/**
 * Log override error to console
 *
 * @param error - The error that occurred
 */
export function logOverrideError(error: unknown): void {
  console.error('[Manual Overrides] Error performing manual override:', error)
}

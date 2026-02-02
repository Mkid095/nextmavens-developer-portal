/**
 * Manual Overrides Workflow Module
 *
 * Provides main workflow orchestration for manual override operations.
 * Handles the complete override process from validation to execution.
 */

import {
  ManualOverrideAction,
  ManualOverrideRequest,
  ManualOverrideResult,
  OverrideRecord,
  PreviousStateSnapshot,
  ProjectStatus,
  HardCapType,
} from '../../types'
import { getProjectQuota, setProjectQuota } from '../quotas'
import { unsuspendProject, getSuspensionStatus } from '../suspensions'
import { validateManualOverrideRequest } from './validation'
import {
  getProjectStatus,
  getAllCaps,
  createOverrideRecord,
} from './database'
import {
  logManualOverride,
  logOverrideCompletion,
  logOverrideError,
} from './notifications'

/**
 * Perform a single override operation on a project
 *
 * @param projectId - The project to override
 * @param action - The action to perform
 * @param newCaps - Optional new cap values
 * @returns Result of the override operation
 */
async function overrideProject(
  projectId: string,
  action: ManualOverrideAction,
  newCaps?: Partial<Record<HardCapType, number>>
): Promise<{
  newStatus: ProjectStatus
  actualNewCaps?: Record<HardCapType, number>
}> {
  const currentStatus = await getProjectStatus(projectId)
  let newStatus = currentStatus

  // Handle unsuspend action
  if (
    action === ManualOverrideAction.UNSUSPEND ||
    action === ManualOverrideAction.BOTH
  ) {
    if (currentStatus === ProjectStatus.SUSPENDED) {
      await unsuspendProject(projectId, 'Manual override')
      newStatus = ProjectStatus.ACTIVE
    }
  }

  // Handle increase caps action
  let actualNewCaps: Record<HardCapType, number> | undefined

  if (
    (action === ManualOverrideAction.INCREASE_CAPS ||
      action === ManualOverrideAction.BOTH) &&
    newCaps
  ) {
    // Apply new caps
    for (const [capType, value] of Object.entries(newCaps)) {
      await setProjectQuota(projectId, capType as HardCapType, value)
    }

    actualNewCaps = await getAllCaps(projectId)
  }

  return { newStatus, actualNewCaps }
}

/**
 * Perform a manual override on a project
 *
 * This is the main function for manual override operations.
 * It handles unsuspension, cap increases, or both, with full audit logging.
 *
 * @param request - The override request
 * @param performedBy - User ID of the performer
 * @param ipAddress - Optional IP address of the performer
 * @returns Result of the override operation
 */
export async function performManualOverride(
  request: ManualOverrideRequest,
  performedBy: string,
  ipAddress?: string
): Promise<ManualOverrideResult> {
  try {
    // Validate the request
    const validation = await validateManualOverrideRequest(request)
    if (!validation.valid) {
      return {
        success: false,
        overrideRecord: {} as OverrideRecord,
        previousState: {} as PreviousStateSnapshot,
        currentState: { status: ProjectStatus.ACTIVE },
        error: validation.error,
      }
    }

    const { projectId, action, reason, newCaps, notes } = request

    // Capture previous state
    const previousStatus = await getProjectStatus(projectId)
    const previousCaps = await getAllCaps(projectId)
    const suspension = await getSuspensionStatus(projectId)

    const previousState: PreviousStateSnapshot = {
      previousStatus,
      previousCaps,
      wasSuspended: suspension !== null,
    }

    // Perform the override
    const overrideResult = await overrideProject(projectId, action, newCaps)

    // Create override record
    const overrideRecord = await createOverrideRecord({
      projectId,
      action,
      reason,
      notes,
      previousCaps,
      newCaps: overrideResult.actualNewCaps,
      performedBy,
      ipAddress,
      previousStatus,
      newStatus: overrideResult.newStatus,
    })

    // Log the manual intervention
    await logManualOverride(
      projectId,
      performedBy,
      action,
      reason,
      notes,
      previousStatus,
      overrideResult.newStatus,
      previousCaps,
      overrideResult.actualNewCaps,
      ipAddress
    )

    // Log completion
    logOverrideCompletion(action, projectId, performedBy)

    return {
      success: true,
      overrideRecord,
      previousState,
      currentState: {
        status: overrideResult.newStatus,
        caps: overrideResult.actualNewCaps,
      },
    }
  } catch (error) {
    logOverrideError(error)

    return {
      success: false,
      overrideRecord: {} as OverrideRecord,
      previousState: {} as PreviousStateSnapshot,
      currentState: { status: ProjectStatus.ACTIVE },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

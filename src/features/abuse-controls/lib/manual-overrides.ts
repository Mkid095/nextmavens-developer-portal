/**
 * Manual Overrides Library
 *
 * Provides manual override functionality for administrators to handle edge cases.
 * Allows operators to:
 * - Unsuspend suspended projects
 * - Increase hard caps for projects
 * - Both unsuspend and increase caps
 *
 * All overrides are fully audited with reason, performer, and timestamp.
 */

import { getPool } from '@/lib/db'
import {
  ManualOverrideAction,
  ManualOverrideRequest,
  ManualOverrideResult,
  OverrideRecord,
  PreviousStateSnapshot,
  ProjectStatus,
  HardCapType,
} from '../types'
import { getProjectQuotas, setProjectQuota, getProjectQuota } from './quotas'
import { suspendProject, unsuspendProject, getSuspensionStatus } from './suspensions'
import { logManualIntervention } from './audit-logger'

/**
 * Validate manual override request
 *
 * @param request - The override request to validate
 * @returns Validation result with success flag and error message if invalid
 */
export async function validateManualOverrideRequest(
  request: ManualOverrideRequest
): Promise<{ valid: boolean; error?: string }> {
  // Validate reason is provided
  if (!request.reason || request.reason.trim().length === 0) {
    return {
      valid: false,
      error: 'Reason is required for manual override',
    }
  }

  if (request.reason.length > 1000) {
    return {
      valid: false,
      error: 'Reason cannot exceed 1000 characters',
    }
  }

  // Validate action type
  if (
    ![
      ManualOverrideAction.UNSUSPEND,
      ManualOverrideAction.INCREASE_CAPS,
      ManualOverrideAction.BOTH,
    ].includes(request.action)
  ) {
    return {
      valid: false,
      error: 'Invalid action type. Must be unsuspend, increase_caps, or both',
    }
  }

  // Validate new caps if provided
  if (
    request.action === ManualOverrideAction.INCREASE_CAPS ||
    request.action === ManualOverrideAction.BOTH
  ) {
    if (!request.newCaps || Object.keys(request.newCaps).length === 0) {
      return {
        valid: false,
        error: 'newCaps must be provided when action is increase_caps or both',
      }
    }

    // Validate each cap value
    for (const [capType, value] of Object.entries(request.newCaps)) {
      if (!Object.values(HardCapType).includes(capType as HardCapType)) {
        return {
          valid: false,
          error: `Invalid cap type: ${capType}`,
        }
      }

      if (typeof value !== 'number' || value < 0 || value > 1_000_000) {
        return {
          valid: false,
          error: `Invalid value for ${capType}: must be between 0 and 1,000,000`,
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Get current project status from database
 *
 * @param projectId - The project ID to check
 * @returns Current project status
 */
async function getProjectStatus(projectId: string): Promise<ProjectStatus> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT status
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      throw new Error('Project not found')
    }

    return result.rows[0].status as ProjectStatus
  } catch (error) {
    console.error('[Manual Overrides] Error getting project status:', error)
    throw new Error('Failed to get project status')
  }
}

/**
 * Get all caps for a project as a record
 *
 * @param projectId - The project ID
 * @returns Record of all cap types and their values
 */
async function getAllCaps(projectId: string): Promise<Record<HardCapType, number>> {
  const quotas = await getProjectQuotas(projectId)
  const caps: Record<HardCapType, number> = {} as Record<HardCapType, number>

  // Initialize with defaults
  for (const capType of Object.values(HardCapType)) {
    caps[capType] = 0
  }

  // Fill in actual values
  for (const quota of quotas) {
    caps[quota.cap_type as HardCapType] = quota.cap_value
  }

  return caps
}

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
  const pool = getPool()

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
    const insertResult = await pool.query(
      `
      INSERT INTO manual_overrides (
        project_id,
        action,
        reason,
        notes,
        previous_caps,
        new_caps,
        performed_by,
        ip_address,
        previous_status,
        new_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, project_id, action, reason, notes, previous_caps, new_caps,
                performed_by, performed_at, ip_address, previous_status, new_status
      `,
      [
        projectId,
        action,
        reason,
        notes || null,
        JSON.stringify(previousCaps),
        overrideResult.actualNewCaps
          ? JSON.stringify(overrideResult.actualNewCaps)
          : null,
        performedBy,
        ipAddress || null,
        previousStatus,
        overrideResult.newStatus,
      ]
    )

    const overrideRecord: OverrideRecord = {
      id: insertResult.rows[0].id,
      project_id: insertResult.rows[0].project_id,
      action: insertResult.rows[0].action as ManualOverrideAction,
      reason: insertResult.rows[0].reason,
      notes: insertResult.rows[0].notes || undefined,
      previous_caps: previousCaps,
      new_caps: overrideResult.actualNewCaps,
      performed_by: insertResult.rows[0].performed_by,
      performed_at: insertResult.rows[0].performed_at,
      ip_address: insertResult.rows[0].ip_address || undefined,
      previous_status: insertResult.rows[0].previous_status as ProjectStatus,
      new_status: insertResult.rows[0].new_status as ProjectStatus,
    }

    // Log the manual intervention
    await logManualIntervention(
      projectId,
      performedBy,
      `Manual override: ${action}`,
      {
        action,
        reason,
        notes,
        previous_status: previousStatus,
        new_status: overrideResult.newStatus,
        previous_caps: previousCaps,
        new_caps: overrideResult.actualNewCaps,
        ip_address: ipAddress,
      }
    )

    console.log(
      `[Manual Overrides] Performed ${action} on project ${projectId} by ${performedBy}`
    )

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
    console.error('[Manual Overrides] Error performing manual override:', error)

    return {
      success: false,
      overrideRecord: {} as OverrideRecord,
      previousState: {} as PreviousStateSnapshot,
      currentState: { status: ProjectStatus.ACTIVE },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get override history for a project
 *
 * @param projectId - The project to get history for
 * @param limit - Maximum number of records to return
 * @returns Array of override records
 */
export async function getOverrideHistory(
  projectId: string,
  limit: number = 50
): Promise<OverrideRecord[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id, project_id, action, reason, notes, previous_caps, new_caps,
        performed_by, performed_at, ip_address, previous_status, new_status
      FROM manual_overrides
      WHERE project_id = $1
      ORDER BY performed_at DESC
      LIMIT $2
      `,
      [projectId, limit]
    )

    return result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      action: row.action as ManualOverrideAction,
      reason: row.reason,
      notes: row.notes || undefined,
      previous_caps: row.previous_caps as Record<HardCapType, number>,
      new_caps: row.new_caps as Record<HardCapType, number> | undefined,
      performed_by: row.performed_by,
      performed_at: row.performed_at,
      ip_address: row.ip_address || undefined,
      previous_status: row.previous_status as ProjectStatus,
      new_status: row.new_status as ProjectStatus,
    }))
  } catch (error) {
    console.error('[Manual Overrides] Error getting override history:', error)
    throw new Error('Failed to get override history')
  }
}

/**
 * Get overrides by project (alias for getOverrideHistory)
 *
 * @param projectId - The project to get overrides for
 * @param limit - Maximum number of records to return
 * @returns Array of override records
 */
export async function getProjectOverrides(
  projectId: string,
  limit: number = 50
): Promise<OverrideRecord[]> {
  return getOverrideHistory(projectId, limit)
}

/**
 * Get all overrides across all projects (for admin)
 *
 * @param limit - Maximum number of records to return
 * @param offset - Number of records to skip
 * @returns Array of override records
 */
export async function getAllOverrides(
  limit: number = 100,
  offset: number = 0
): Promise<OverrideRecord[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        mo.id, mo.project_id, mo.action, mo.reason, mo.notes,
        mo.previous_caps, mo.new_caps,
        mo.performed_by, mo.performed_at, mo.ip_address,
        mo.previous_status, mo.new_status,
        p.project_name
      FROM manual_overrides mo
      JOIN projects p ON mo.project_id = p.id
      ORDER BY mo.performed_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    )

    return result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      action: row.action as ManualOverrideAction,
      reason: row.reason,
      notes: row.notes || undefined,
      previous_caps: row.previous_caps as Record<HardCapType, number>,
      new_caps: row.new_caps as Record<HardCapType, number> | undefined,
      performed_by: row.performed_by,
      performed_at: row.performed_at,
      ip_address: row.ip_address || undefined,
      previous_status: row.previous_status as ProjectStatus,
      new_status: row.new_status as ProjectStatus,
    }))
  } catch (error) {
    console.error('[Manual Overrides] Error getting all overrides:', error)
    throw new Error('Failed to get all overrides')
  }
}

/**
 * Get override statistics
 *
 * @returns Statistics about overrides
 */
export async function getOverrideStatistics(): Promise<{
  total: number
  byAction: Record<string, number>
  recentCount: number
}> {
  const pool = getPool()

  try {
    // Get total count
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM manual_overrides
      `
    )

    const total = parseInt(totalResult.rows[0].count)

    // Get count by action
    const byActionResult = await pool.query(
      `
      SELECT action, COUNT(*) as count
      FROM manual_overrides
      GROUP BY action
      `
    )

    const byAction: Record<string, number> = {}
    for (const row of byActionResult.rows) {
      byAction[row.action] = parseInt(row.count)
    }

    // Get recent count (last 7 days)
    const recentResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM manual_overrides
      WHERE performed_at >= NOW() - INTERVAL '7 days'
      `
    )

    const recentCount = parseInt(recentResult.rows[0].count)

    return {
      total,
      byAction,
      recentCount,
    }
  } catch (error) {
    console.error('[Manual Overrides] Error getting override statistics:', error)
    throw new Error('Failed to get override statistics')
  }
}

/**
 * Get a specific override by ID
 *
 * @param overrideId - The override ID
 * @returns The override record or null if not found
 */
export async function getOverrideById(
  overrideId: string
): Promise<OverrideRecord | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id, project_id, action, reason, notes, previous_caps, new_caps,
        performed_by, performed_at, ip_address, previous_status, new_status
      FROM manual_overrides
      WHERE id = $1
      `,
      [overrideId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]

    return {
      id: row.id,
      project_id: row.project_id,
      action: row.action as ManualOverrideAction,
      reason: row.reason,
      notes: row.notes || undefined,
      previous_caps: row.previous_caps as Record<HardCapType, number>,
      new_caps: row.new_caps as Record<HardCapType, number> | undefined,
      performed_by: row.performed_by,
      performed_at: row.performed_at,
      ip_address: row.ip_address || undefined,
      previous_status: row.previous_status as ProjectStatus,
      new_status: row.new_status as ProjectStatus,
    }
  } catch (error) {
    console.error('[Manual Overrides] Error getting override by ID:', error)
    throw new Error('Failed to get override')
  }
}

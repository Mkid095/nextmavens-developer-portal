/**
 * Override Suspension Service
 *
 * Service layer for the override suspension break glass power.
 * Handles the business logic for overriding auto-suspension and
 * increasing hard caps for legitimate high-usage projects.
 *
 * US-005: Implement Override Suspension Power - Step 1: Foundation
 */

import { getPool } from '@/lib/db'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { QuotaManager } from '@/features/abuse-controls/lib/data-layer'
import { logBreakGlassAction, AdminActionType, AdminTargetType } from '../aggressive-audit-logger'
import type {
  OverrideProjectState,
  OverrideActionLog,
  OverrideSuspensionResponse,
  OverrideSuspensionError,
} from '../types/override-suspension.types'
import { HardCapType } from '@/features/abuse-controls/types'
import { invalidateSnapshot } from '@/lib/snapshot'
import type { OverrideSuspensionParams, HardCapUpdate } from './types'

/**
 * Hard cap update record
 */

/**
 * Override a suspended project's suspension and optionally increase hard caps
 *
 * This operation:
 * 1. Validates the project exists
 * 2. Captures the current state (before)
 * 3. Clears suspension flags if requested
 * 4. Optionally increases hard caps
 * 5. Logs the action with before/after states
 *
 * @param params - Override operation parameters
 * @returns Result of the override operation
 * @throws Error if project not found or database operation fails
 *
 * @example
 * ```typescript
 * const result = await overrideSuspension({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Customer verified legitimate usage',
 *   newHardCaps: [
 *     { type: 'db_queries_per_day', value: 50000 },
 *     { type: 'storage_uploads_per_day', value: 5000 },
 *   ],
 * });
 * ```
 */
export async function overrideSuspension(
  params: OverrideSuspensionParams
): Promise<OverrideSuspensionResponse> {
  const {
    projectId,
    sessionId,
    adminId,
    reason,
    clearSuspensionFlags = true,
    newHardCaps,
    increaseCapsByPercent,
  } = params

  const pool = getPool()

  // Step 1: Get current project state
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.project_name,
      p.status,
      p.tenant_id,
      p.developer_id,
      p.created_at
    FROM projects p
    WHERE p.id = $1
    `,
    [projectId]
  )

  if (projectResult.rows.length === 0) {
    const error: OverrideSuspensionError = {
      error: 'Project not found',
      details: `Project with ID ${projectId} does not exist`,
      code: 'PROJECT_NOT_FOUND',
    }
    throw new Error(JSON.stringify(error))
  }

  const project = projectResult.rows[0]

  // Step 2: Get current suspension state
  const suspension = await SuspensionManager.getStatus(projectId)

  // Step 3: Get current quotas
  const currentQuotas = await QuotaManager.getQuotas(projectId)
  const quotaMap = new Map(currentQuotas.map((q) => [q.cap_type, q.cap_value]))

  // Capture before state
  const beforeState: Record<string, unknown> = {
    project_id: project.id,
    project_name: project.project_name,
    status: project.status,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    suspension: suspension
      ? {
          suspended: true,
          cap_exceeded: suspension.cap_exceeded,
          reason: suspension.reason,
          suspended_at: suspension.suspended_at,
          notes: suspension.notes,
        }
      : {
          suspended: false,
        },
    quotas: Object.fromEntries(quotaMap),
  }

  // Step 4: Clear suspension flags if requested
  let clearedSuspension = false
  if (clearSuspensionFlags && suspension) {
    await SuspensionManager.unsuspend(
      projectId,
      'Break glass override suspension operation'
    )
    clearedSuspension = true
  }

  // Step 5: Update hard caps if requested
  const capUpdates: HardCapUpdate[] = []
  let capsUpdated = false

  if (newHardCaps && newHardCaps.length > 0) {
    for (const cap of newHardCaps) {
      const previousValue = quotaMap.get(cap.type as HardCapType)
      if (previousValue === undefined) {
        // New cap - set it
        await QuotaManager.updateQuota(
          projectId,
          cap.type as HardCapType,
          cap.value
        )
        capUpdates.push({
          type: cap.type,
          previous_value: 0,
          new_value: cap.value,
        })
      } else {
        // Existing cap - update it
        await QuotaManager.updateQuota(
          projectId,
          cap.type as HardCapType,
          cap.value
        )
        capUpdates.push({
          type: cap.type,
          previous_value: previousValue,
          new_value: cap.value,
        })
      }
    }
    capsUpdated = capUpdates.length > 0
  } else if (increaseCapsByPercent && increaseCapsByPercent > 0) {
    // Increase all existing caps by percentage
    const multiplier = 1 + increaseCapsByPercent / 100
    for (const [capType, currentValue] of quotaMap.entries()) {
      const newValue = Math.floor(currentValue * multiplier)
      await QuotaManager.updateQuota(
        projectId,
        capType as HardCapType,
        newValue
      )
      capUpdates.push({
        type: capType,
        previous_value: currentValue,
        new_value: newValue,
      })
    }
    capsUpdated = capUpdates.length > 0
  }

  // Step 6: Update project status to ACTIVE (if it was suspended)
  let updatedProject = project
  if (project.status !== 'ACTIVE') {
    const updateResult = await pool.query(
      `
      UPDATE projects
      SET status = 'ACTIVE',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, project_name, status, updated_at
      `,
      [projectId]
    )
    updatedProject = updateResult.rows[0]
  }

  // Invalidate snapshot cache for this project
  invalidateSnapshot(projectId)

  // Capture after state
  const afterState: Record<string, unknown> = {
    project_id: updatedProject.id,
    project_name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: project.status,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    suspension_cleared: clearedSuspension,
    caps_updated: capsUpdated,
    cap_updates: capUpdates,
    overridden_at: updatedProject.updated_at || new Date(),
    admin_reason: reason || null,
  }

  // Step 7: Log the admin action to BOTH admin_actions AND audit_logs (aggressive logging)
  const action = await logBreakGlassAction({
    adminId,
    sessionId,
    action: AdminActionType.OVERRIDE_SUSPENSION,
    targetType: AdminTargetType.PROJECT,
    targetId: projectId,
    beforeState,
    afterState,
    metadata: {
      reason: reason || 'No reason provided',
      project_name: project.project_name,
      previous_status: project.status,
      suspension_cleared: clearedSuspension,
      caps_updated: capsUpdated,
      cap_updates: capUpdates,
    },
    projectId,
    developerId: adminId,
  })

  // Step 8: Build response
  const overriddenProject: OverrideProjectState = {
    id: updatedProject.id,
    name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: project.status,
    overridden_at: updatedProject.updated_at || new Date(),
    suspension_cleared: clearedSuspension,
  }

  if (suspension) {
    overriddenProject.previous_suspension = {
      cap_exceeded: suspension.cap_exceeded,
      reason:
        (suspension.reason as any).cap_type ||
        (suspension.reason as any).details ||
        'Unknown',
      suspended_at: suspension.suspended_at,
      notes: suspension.notes || null,
    }
  }

  if (capsUpdated && capUpdates.length > 0) {
    overriddenProject.caps_updated = true
    overriddenProject.new_caps = capUpdates
  }

  const actionLog: OverrideActionLog = {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  }

  const response: OverrideSuspensionResponse = {
    success: true,
    project: overriddenProject,
    action_log: actionLog,
  }

  // Add warning if project was already active and had no suspension
  if (project.status === 'ACTIVE' && !suspension && !capsUpdated) {
    response.warning =
      'Project was already ACTIVE, had no suspension, and no caps were updated'
  } else if (!clearedSuspension && !capsUpdated) {
    response.warning =
      'No suspension was cleared and no caps were updated (no changes made)'
  }

  return response
}

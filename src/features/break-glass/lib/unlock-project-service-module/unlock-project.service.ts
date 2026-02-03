/**
 * Unlock Project Service - Module - Main Service
 */

import { getPool } from '@/lib/db'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import {
  logAdminAction,
  AdminActionType,
  AdminTargetType,
} from '../admin-database'
import { logBreakGlassAction } from '../aggressive-audit-logger'
import type {
  UnlockedProjectState,
  UnlockActionLog,
  UnlockProjectResponse,
  UnlockProjectParams,
} from '../types'
import { getProject, updateProjectStatus, getUnlockHistoryQuery } from './db'
import { validateUnlockRequest, validateProjectExists } from './validators'
import { captureBeforeState, captureAfterState } from './state-capture'
import { clearSuspensionIfNeeded, updateProjectToActive, invalidateProjectSnapshot } from './handlers'
import { buildUnlockedProjectState, buildActionLog, buildUnlockResponse } from './builders'

export { validateUnlockRequest } from './validators'

export async function unlockProject(
  params: UnlockProjectParams
): Promise<UnlockProjectResponse> {
  const { projectId, sessionId, adminId, reason, clearSuspensionFlags = true } = params
  const pool = getPool()

  // Validate request
  const validation = validateUnlockRequest(params)
  if (!validation.valid) {
    throw new Error(JSON.stringify({ errors: validation.errors }))
  }

  // Validate project exists
  await validateProjectExists(pool, projectId)

  // Get current project state
  const project = await getProject(pool, projectId)

  // Get current suspension state
  const suspension = await SuspensionManager.getStatus(projectId)

  // Capture before state
  const beforeState = captureBeforeState(project, suspension)

  // Clear suspension flags if requested
  const clearedSuspension = await clearSuspensionIfNeeded(projectId, suspension, clearSuspensionFlags)

  // Update project status to ACTIVE
  const updatedProject = await updateProjectToActive(pool, projectId)

  // Invalidate snapshot cache
  invalidateProjectSnapshot(projectId)

  // Capture after state
  const afterState = captureAfterState(updatedProject, project, clearedSuspension, reason)

  // Log the admin action
  const action = await logBreakGlassAction({
    adminId,
    sessionId,
    action: AdminActionType.UNLOCK_PROJECT,
    targetType: AdminTargetType.PROJECT,
    targetId: projectId,
    beforeState,
    afterState,
    metadata: {
      reason: reason || 'No reason provided',
      project_name: project.project_name,
      previous_status: project.status,
      suspension_cleared: clearedSuspension,
    },
    projectId,
    developerId: adminId,
  })

  // Build response
  const unlockedProject = buildUnlockedProjectState(
    updatedProject,
    project.status,
    suspension || undefined
  )

  const actionLog = buildActionLog(action)

  return buildUnlockResponse(
    unlockedProject,
    actionLog,
    project.status === 'ACTIVE',
    !suspension
  )
}

export async function getUnlockHistory(projectId: string): Promise<UnlockActionLog[]> {
  const pool = getPool()
  const { AdminActionType } = await import('../admin-database')

  const rows = await getUnlockHistoryQuery(pool, AdminActionType.UNLOCK_PROJECT, projectId)

  return rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    before_state: row.before_state as Record<string, unknown>,
    after_state: row.after_state as Record<string, unknown>,
    logged_at: row.created_at,
  }))
}

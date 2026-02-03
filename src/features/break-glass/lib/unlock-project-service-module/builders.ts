/**
 * Unlock Project Service - Module - Response Builders
 */

import type {
  UnlockedProjectState,
  UnlockActionLog,
  UnlockProjectResponse,
} from '../types'
import type { SuspensionStatus } from '@/features/abuse-controls/types'
import { WARNINGS } from './constants'

export function buildUnlockedProjectState(
  updatedProject: any,
  originalStatus: string,
  suspension?: SuspensionStatus
): UnlockedProjectState {
  const state: UnlockedProjectState = {
    id: updatedProject.id,
    name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: originalStatus,
    unlocked_at: updatedProject.updated_at,
  }

  if (suspension) {
    state.previous_suspension = {
      cap_exceeded: suspension.cap_exceeded,
      reason: suspension.reason.cap_type || suspension.reason.details || 'Unknown',
      suspended_at: suspension.suspended_at,
      notes: suspension.notes || null,
    }
  }

  return state
}

export function buildActionLog(action: any): UnlockActionLog {
  return {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  }
}

export function buildUnlockResponse(
  unlockedProject: UnlockedProjectState,
  actionLog: UnlockActionLog,
  projectWasActive: boolean,
  hadNoSuspension: boolean
): UnlockProjectResponse {
  const response: UnlockProjectResponse = {
    success: true,
    project: unlockedProject,
    action_log: actionLog,
  }

  // Add warning if project was already active
  if (projectWasActive && hadNoSuspension) {
    response.warning = WARNINGS.ALREADY_ACTIVE
  }

  return response
}

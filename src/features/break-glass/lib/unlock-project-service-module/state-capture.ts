/**
 * Unlock Project Service - Module - State Capture
 */

import type { SuspensionStatus } from '@/features/abuse-controls/types'

export interface BeforeState {
  project_id: string
  project_name: string
  status: string
  tenant_id: string
  developer_id: string
  suspension: SuspensionState
}

export interface SuspensionState {
  suspended: boolean
  cap_exceeded?: boolean
  reason?: string
  suspended_at?: Date
  notes?: string | null
}

export interface AfterState {
  project_id: string
  project_name: string
  status: string
  previous_status: string
  tenant_id: string
  developer_id: string
  suspension_cleared: boolean
  unlocked_at: Date
  admin_reason: string | null
}

export function captureBeforeState(
  project: any,
  suspension: SuspensionStatus | null
): BeforeState {
  return {
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
  }
}

export function captureAfterState(
  updatedProject: any,
  originalProject: any,
  clearedSuspension: boolean,
  reason?: string
): AfterState {
  return {
    project_id: updatedProject.id,
    project_name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: originalProject.status,
    tenant_id: updatedProject.tenant_id,
    developer_id: updatedProject.developer_id,
    suspension_cleared: clearedSuspension,
    unlocked_at: updatedProject.updated_at,
    admin_reason: reason || null,
  }
}

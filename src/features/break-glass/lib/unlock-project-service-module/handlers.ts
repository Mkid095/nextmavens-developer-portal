/**
 * Unlock Project Service - Module - Handlers
 */

import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { invalidateSnapshot } from '@/lib/snapshot'
import type { SuspensionStatus } from '@/features/abuse-controls/types'

export async function clearSuspensionIfNeeded(
  projectId: string,
  suspension: SuspensionStatus | null,
  shouldClear: boolean
): Promise<boolean> {
  if (!shouldClear || !suspension) {
    return false
  }

  await SuspensionManager.unsuspend(projectId, 'Break glass unlock operation')
  return true
}

export async function updateProjectToActive(
  pool: any,
  projectId: string
): Promise<{ id: string; project_name: string; status: string; updated_at: Date }> {
  const { updateProjectStatus } = await import('./db')
  const result = await updateProjectStatus(pool, projectId)
  return {
    id: result.id,
    project_name: result.project_name,
    status: result.status,
    updated_at: result.updated_at,
  }
}

export function invalidateProjectSnapshot(projectId: string): void {
  invalidateSnapshot(projectId)
}

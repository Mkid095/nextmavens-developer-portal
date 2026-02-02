/**
 * Project Overrides API - Type Definitions
 *
 * POST /api/projects/[projectId]/overrides
 * GET /api/projects/[projectId]/overrides
 */

import type { ManualOverrideAction } from '@/features/abuse-controls/types'

/**
 * Manual override request data
 */
export interface ManualOverrideRequest {
  action: ManualOverrideAction
  reason: string
  newCaps?: Record<string, number>
  notes?: string
}

/**
 * Manual override result
 */
export interface ManualOverrideResult {
  override_record: {
    id: string
    project_id: string
    action: string
    reason: string
    notes: string | null
    performed_by: string
    performed_at: Date
  }
  previous_state: {
    status: string
    caps: Record<string, number>
    was_suspended: boolean
  }
  current_state: {
    status: string
    caps: Record<string, number>
  }
}

/**
 * Override history item
 */
export interface OverrideHistoryItem {
  id: string
  action: string
  reason: string
  notes: string | null
  previous_status: string | null
  new_status: string | null
  previous_caps: Record<string, number> | null
  new_caps: Record<string, number> | null
  performed_by: string
  performed_at: Date
}

/**
 * Override history response
 */
export interface OverrideHistoryResponse {
  project_id: string
  count: number
  overrides: OverrideHistoryItem[]
}

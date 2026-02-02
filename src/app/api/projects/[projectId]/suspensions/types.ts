/**
 * Suspensions API Types
 */

import type { SuspensionReason } from '@/features/abuse-controls/types'

export interface SuspensionStatusResponse {
  suspended: boolean
  message?: string
  suspension?: {
    id: string
    cap_exceeded: boolean
    reason: SuspensionReason
    suspended_at: Date
    notes: string | null
  }
}

export interface ManualSuspensionRequest {
  cap_type: string
  current_value: number
  limit_exceeded: number
  details?: string
  notes?: string
}

export interface ManualUnsuspensionRequest {
  notes?: string
}

export interface SuspensionsErrorResponse {
  error: string
  details?: unknown
}

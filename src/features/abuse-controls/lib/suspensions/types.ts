/**
 * Suspensions Module - Type Definitions
 */

import type { SuspensionReason, SuspensionRecord } from '../../types'

export interface SuspensionHistoryEntry {
  action: string
  occurred_at: Date
  reason: SuspensionReason
}

export interface ProjectDetails {
  projectName: string
  orgName: string
}

export type { SuspensionReason, SuspensionRecord }

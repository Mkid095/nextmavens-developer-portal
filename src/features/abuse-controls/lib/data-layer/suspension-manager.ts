/**
 * Suspension Manager - Main interface for suspension operations
 */

import {
  suspendProject,
  unsuspendProject,
  getSuspensionStatus,
  getAllActiveSuspensions,
  getSuspensionHistory,
} from '../suspensions'
import { HardCapType } from '../../types'
import type { SuspensionRecord, SuspensionReason } from '../../types'
import { ProjectSuspendedError } from './types'

/**
 * Suspension Manager - Main interface for suspension operations
 */
export class SuspensionManager {
  /**
   * Suspend a project
   */
  static async suspend(
    projectId: string,
    reason: SuspensionReason,
    notes?: string
  ): Promise<void> {
    await suspendProject(projectId, reason, notes)
  }

  /**
   * Unsuspend a project
   */
  static async unsuspend(projectId: string, notes?: string): Promise<void> {
    await unsuspendProject(projectId, notes)
  }

  /**
   * Get suspension status for a project
   */
  static async getStatus(projectId: string): Promise<SuspensionRecord | null> {
    return getSuspensionStatus(projectId)
  }

  /**
   * Check if a project is currently suspended
   */
  static async isSuspended(projectId: string): Promise<boolean> {
    const status = await getSuspensionStatus(projectId)
    return status !== null
  }

  /**
   * Get all active suspensions
   */
  static async getAllActive(): Promise<SuspensionRecord[]> {
    return getAllActiveSuspensions()
  }

  /**
   * Get suspension history for a project
   */
  static async getHistory(
    projectId: string
  ): Promise<Array<{ action: string; occurred_at: Date; reason: SuspensionReason }>> {
    return getSuspensionHistory(projectId)
  }

  /**
   * Suspend a project for exceeding a specific cap
   */
  static async suspendForCapViolation(
    projectId: string,
    capType: HardCapType,
    currentValue: number,
    limit: number,
    details?: string
  ): Promise<void> {
    const reason: SuspensionReason = {
      cap_type: capType,
      current_value: currentValue,
      limit_exceeded: limit,
      details,
    }
    await suspendProject(projectId, reason, `Auto-suspended for exceeding ${capType}`)
  }
}

/**
 * Middleware helper for suspension checks in API routes
 */
export async function withSuspensionCheck<T>(
  projectId: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if project is suspended
  const suspension = await getSuspensionStatus(projectId)

  if (suspension) {
    throw new ProjectSuspendedError(
      projectId,
      suspension.cap_exceeded,
      suspension.reason
    )
  }

  // Perform the operation
  return operation()
}

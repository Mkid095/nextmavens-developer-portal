/**
 * Data Layer Integration for Abuse Controls
 *
 * This module provides centralized access to quota management and enforcement
 * for integration with other parts of the application.
 */

import {
  getProjectQuotas,
  setProjectQuota,
  getProjectQuotaStats,
  applyDefaultQuotas,
  resetProjectQuotas,
} from './quotas'
import {
  checkQuota,
  checkMultipleQuotas,
  canPerformOperation,
  recordUsage,
  getQuotaViolations,
} from './enforcement'
import {
  suspendProject,
  unsuspendProject,
  getSuspensionStatus,
  getAllActiveSuspensions,
  getSuspensionHistory,
} from './suspensions'
import { HardCapType } from '../types'
import type { SuspensionRecord, SuspensionReason } from '../types'

/**
 * Quota Manager - Main interface for quota operations
 */
export class QuotaManager {
  /**
   * Initialize quotas for a new project
   */
  static async initializeProject(projectId: string): Promise<void> {
    await applyDefaultQuotas(projectId)
  }

  /**
   * Get quota configuration for a project
   */
  static async getQuotas(projectId: string) {
    return getProjectQuotas(projectId)
  }

  /**
   * Get quota statistics for a project
   */
  static async getStats(projectId: string) {
    return getProjectQuotaStats(projectId)
  }

  /**
   * Update a quota for a project
   */
  static async updateQuota(
    projectId: string,
    capType: HardCapType,
    value: number
  ) {
    return setProjectQuota(projectId, capType, value)
  }

  /**
   * Reset all quotas for a project to defaults
   */
  static async resetToDefaults(projectId: string) {
    return resetProjectQuotas(projectId)
  }

  /**
   * Check if an operation is allowed
   */
  static async isAllowed(
    projectId: string,
    operationType: HardCapType
  ): Promise<boolean> {
    return canPerformOperation(projectId, operationType)
  }

  /**
   * Check quota with detailed information
   */
  static async checkWithDetails(
    projectId: string,
    capType: HardCapType,
    currentUsage: number
  ) {
    return checkQuota(projectId, capType, currentUsage)
  }

  /**
   * Record usage for an operation
   */
  static async record(
    projectId: string,
    capType: HardCapType,
    amount: number = 1
  ): Promise<void> {
    await recordUsage(projectId, capType, amount)
  }

  /**
   * Get all active violations for a project
   */
  static async getViolations(projectId: string) {
    return getQuotaViolations(projectId)
  }
}

/**
 * Middleware helper for quota enforcement in API routes
 */
export async function withQuotaCheck<T>(
  projectId: string,
  operationType: HardCapType,
  operation: () => Promise<T>
): Promise<T> {
  // Check if operation is allowed
  const allowed = await canPerformOperation(projectId, operationType)

  if (!allowed) {
    throw new QuotaExceededError(
      operationType,
      projectId
    )
  }

  // Perform the operation
  const result = await operation()

  // Record usage
  await recordUsage(projectId, operationType, 1)

  return result
}

/**
 * Custom error for quota violations
 */
export class QuotaExceededError extends Error {
  constructor(
    public readonly capType: HardCapType,
    public readonly projectId: string
  ) {
    super(`Quota exceeded for ${capType} on project ${projectId}`)
    this.name = 'QuotaExceededError'
  }
}

/**
 * React Hook friendly quota checker (for client-side usage)
 * Note: This would be used with SWR or React Query
 */
export function createQuotaChecker(projectId: string) {
  return {
    check: async (operationType: HardCapType) => {
      return canPerformOperation(projectId, operationType)
    },
    getQuotas: async () => {
      return getProjectQuotas(projectId)
    },
    getStats: async () => {
      return getProjectQuotaStats(projectId)
    },
  }
}

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

/**
 * Custom error for suspended projects
 */
export class ProjectSuspendedError extends Error {
  constructor(
    public readonly projectId: string,
    public readonly capExceeded: HardCapType,
    public readonly reason: SuspensionReason
  ) {
    super(
      `Project ${projectId} is suspended due to exceeding ${capExceeded} limit. ${reason.details || ''}`
    )
    this.name = 'ProjectSuspendedError'
  }
}

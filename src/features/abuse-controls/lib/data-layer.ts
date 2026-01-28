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
import { HardCapType } from '../types'

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

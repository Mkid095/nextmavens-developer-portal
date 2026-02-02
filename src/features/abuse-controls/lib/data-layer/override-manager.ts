/**
 * Override Manager - Main interface for manual override operations
 */

import {
  performManualOverride,
  getOverrideHistory,
  getAllOverrides,
  getOverrideStatistics,
  getOverrideById,
  validateManualOverrideRequest,
} from '../manual-overrides'
import type { ManualOverrideRequest, ManualOverrideResult, OverrideRecord } from '../../types'

/**
 * Override Manager - Main interface for manual override operations
 */
export class OverrideManager {
  /**
   * Perform a manual override on a project
   *
   * @param request - The override request
   * @param performedBy - User ID of the performer
   * @param ipAddress - Optional IP address of the performer
   * @returns Result of the override operation
   */
  static async perform(
    request: ManualOverrideRequest,
    performedBy: string,
    ipAddress?: string
  ): Promise<ManualOverrideResult> {
    return performManualOverride(request, performedBy, ipAddress)
  }

  /**
   * Validate an override request
   *
   * @param request - The override request to validate
   * @returns Validation result
   */
  static async validate(
    request: ManualOverrideRequest
  ): Promise<{ valid: boolean; error?: string }> {
    return validateManualOverrideRequest(request)
  }

  /**
   * Get override history for a project
   *
   * @param projectId - The project to get history for
   * @param limit - Maximum number of records to return
   * @returns Array of override records
   */
  static async getHistory(
    projectId: string,
    limit: number = 50
  ): Promise<OverrideRecord[]> {
    return getOverrideHistory(projectId, limit)
  }

  /**
   * Get overrides for a specific project (alias for getHistory)
   *
   * @param projectId - The project to get overrides for
   * @param limit - Maximum number of records to return
   * @returns Array of override records
   */
  static async getByProject(
    projectId: string,
    limit: number = 50
  ): Promise<OverrideRecord[]> {
    return getOverrideHistory(projectId, limit)
  }

  /**
   * Get all overrides across all projects (admin only)
   *
   * @param limit - Maximum number of records to return
   * @param offset - Number of records to skip
   * @returns Array of override records
   */
  static async getAll(
    limit: number = 100,
    offset: number = 0
  ): Promise<OverrideRecord[]> {
    return getAllOverrides(limit, offset)
  }

  /**
   * Get a specific override by ID
   *
   * @param overrideId - The override ID
   * @returns The override record or null if not found
   */
  static async getById(overrideId: string): Promise<OverrideRecord | null> {
    return getOverrideById(overrideId)
  }

  /**
   * Get override statistics
   *
   * @returns Statistics about overrides
   */
  static async getStatistics(): Promise<{
    total: number
    byAction: Record<string, number>
    recentCount: number
  }> {
    return getOverrideStatistics()
  }
}

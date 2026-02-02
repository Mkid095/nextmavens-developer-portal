/**
 * Usage Calculator Module
 * Functions for calculating usage statistics
 */

import { getUsageStatistics as getUsageStatsFromDb } from '../../migrations/create-usage-metrics-table'

/**
 * Calculate average usage for a project over a time period
 *
 * @param projectId - The project to analyze
 * @param metricType - The metric type (maps to HardCapType)
 * @param startTime - Start of time period
 * @param endTime - End of time period
 * @returns Average usage over the time period
 */
export async function calculateAverageUsage(
  projectId: string,
  metricType: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  try {
    const result = await getUsageStatsFromDb(projectId, metricType, startTime, endTime)

    if (!result.success || !result.data) {
      console.warn(`[Spike Detection] No usage data for project ${projectId}, metric ${metricType}`)
      return 0
    }

    // Return average usage from the statistics
    return result.data.average || 0
  } catch (error) {
    console.error('[Spike Detection] Error calculating average usage:', error)
    return 0
  }
}

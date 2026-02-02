/**
 * Quota Monitor
 *
 * Monitors quota usage from the database.
 * US-005: Implement Quota Warnings
 */

import { getPool } from '@/lib/db'
import {
  QuotaData,
  UsageData,
  QuotaWarningLevel,
  ProjectQuotaWarnings,
  WarningLevelCalculation,
} from './types'
import {
  WARNING_THRESHOLD_80,
  WARNING_THRESHOLD_90,
} from './constants'
import { calculateWarningLevelResult } from './warning-calculator'

/**
 * Get quota configuration for a project and service
 *
 * @param projectId - Project ID
 * @param service - Service name
 * @returns Quota data or null if not configured
 */
export async function getQuotaData(
  projectId: string,
  service: string
): Promise<QuotaData | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT monthly_limit, reset_at
      FROM control_plane.quotas
      WHERE project_id = $1 AND service = $2
      `,
      [projectId, service]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      monthly_limit: row.monthly_limit,
      reset_at: new Date(row.reset_at),
    }
  } catch (error) {
    console.error('[QuotaMonitor] Error getting quota data:', error)
    return null
  }
}

/**
 * Get current usage for a project and service this month
 *
 * @param projectId - Project ID
 * @param service - Service name
 * @returns Current usage amount
 */
export async function getCurrentUsage(
  projectId: string,
  service: string
): Promise<number> {
  const pool = getPool()

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const result = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) as total_usage
      FROM control_plane.usage_snapshots
      WHERE project_id = $1
        AND service = $2
        AND recorded_at >= $3
      `,
      [projectId, service, startOfMonth]
    )

    return parseFloat(result.rows[0].total_usage) || 0
  } catch (error) {
    console.error('[QuotaMonitor] Error getting current usage:', error)
    return 0
  }
}

/**
 * Get all quota configurations for a project
 *
 * @param projectId - Project ID
 * @returns Array of quota data with service names
 */
export async function getAllQuotaData(
  projectId: string
): Promise<Array<{ service: string } & QuotaData>> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT service, monthly_limit, reset_at
      FROM control_plane.quotas
      WHERE project_id = $1
      `,
      [projectId]
    )

    return result.rows.map((row) => ({
      service: row.service,
      monthly_limit: row.monthly_limit,
      reset_at: new Date(row.reset_at),
    }))
  } catch (error) {
    console.error('[QuotaMonitor] Error getting all quota data:', error)
    return []
  }
}

/**
 * Calculate warning level for a specific service
 *
 * @param projectId - Project ID
 * @param service - Service name
 * @returns Warning level calculation or null if no quota configured
 */
export async function calculateServiceWarningLevel(
  projectId: string,
  service: string
): Promise<WarningLevelCalculation | null> {
  const quotaData = await getQuotaData(projectId, service)
  if (!quotaData) {
    return null
  }

  const currentUsage = await getCurrentUsage(projectId, service)

  return calculateWarningLevelResult(
    currentUsage,
    quotaData.monthly_limit,
    quotaData.reset_at
  )
}

/**
 * Get project name by ID
 *
 * @param projectId - Project ID
 * @returns Project name or null if not found
 */
export async function getProjectName(
  projectId: string
): Promise<string | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      'SELECT project_name FROM projects WHERE id = $1',
      [projectId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0].project_name
  } catch (error) {
    console.error('[QuotaMonitor] Error getting project name:', error)
    return null
  }
}

/**
 * Get all active projects
 *
 * @returns Array of active projects
 */
export async function getActiveProjects(): Promise<
  Array<{ id: string; project_name: string }>
> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
      `
    )

    return result.rows
  } catch (error) {
    console.error('[QuotaMonitor] Error getting active projects:', error)
    return []
  }
}

/**
 * Get all quota warnings for a project (for dashboard display)
 *
 * @param projectId - Project ID
 * @returns Array of active warnings
 */
export async function getProjectQuotaWarnings(
  projectId: string
): Promise<ProjectQuotaWarnings | null> {
  const pool = getPool()

  try {
    // Get project details
    const projectName = await getProjectName(projectId)
    if (!projectName) {
      return null
    }

    // Get quota configurations
    const quotasData = await getAllQuotaData(projectId)

    if (quotasData.length === 0) {
      return { projectId, projectName, warnings: [] }
    }

    const warnings: ProjectQuotaWarnings['warnings'] = []

    for (const quota of quotasData) {
      const currentUsage = await getCurrentUsage(projectId, quota.service)
      const usagePercentage = calculateUsagePercentage(
        currentUsage,
        quota.monthly_limit
      )

      // Check if we're at or above warning thresholds
      if (usagePercentage >= WARNING_THRESHOLD_80) {
        const level =
          usagePercentage >= WARNING_THRESHOLD_90
            ? QuotaWarningLevel.WARNING_90
            : QuotaWarningLevel.WARNING_80

        warnings.push({
          service: quota.service,
          level,
          usagePercentage: Math.round(usagePercentage * 10) / 10,
          currentUsage,
          monthlyLimit: quota.monthly_limit,
          resetAt: quota.reset_at,
        })
      }
    }

    return { projectId, projectName, warnings }
  } catch (error) {
    console.error('[QuotaMonitor] Error getting project quota warnings:', error)
    return null
  }
}

/**
 * Calculate usage percentage from current usage and limit
 */
function calculateUsagePercentage(
  currentUsage: number,
  monthlyLimit: number
): number {
  if (monthlyLimit <= 0) {
    return 0
  }
  return (currentUsage / monthlyLimit) * 100
}

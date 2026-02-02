/**
 * Quota Warnings Library
 *
 * Main entry point for quota warnings functionality.
 * Manages quota warning notifications when projects approach their limits.
 * Sends warnings at 80% and 90% of quota usage via email and dashboard alerts.
 *
 * US-005: Implement Quota Warnings
 * - Warning sent at 80% of quota
 * - Warning sent at 90% of quota
 * - Notification sent via email
 * - Warning shown in dashboard
 * - Clear and actionable warning messages
 */

// Re-export types
export {
  QuotaWarningLevel,
  QuotaWarningResult,
  ProjectQuotaWarnings,
} from './types'

export type {
  QuotaData,
  UsageData,
  WarningLevelCalculation,
  QuotaWarningEmail,
  QuotaWarningJobSummary,
  CheckAllProjectsResult,
} from './types'

// Re-export constants
export {
  WARNING_THRESHOLD_80,
  WARNING_THRESHOLD_90,
  MONITORED_SERVICES,
  SERVICES_COUNT_PER_PROJECT,
  getWarningUrgency,
  getWarningThreshold,
} from './constants'

// Re-export calculator functions
export {
  calculateWarningLevel,
  calculateUsagePercentage,
  calculateWarningLevelResult,
  isAboveWarningThreshold,
  isAboveCriticalThreshold,
  shouldShowWarning,
} from './warning-calculator'

// Re-export monitor functions
export {
  getQuotaData,
  getCurrentUsage,
  getAllQuotaData,
  calculateServiceWarningLevel,
  getProjectName,
  getActiveProjects,
  getProjectQuotaWarnings,
} from './quota-monitor'

// Re-export sender functions
export {
  createQuotaWarningEmail,
  sendQuotaWarning,
} from './notification-sender'

// Import for internal use
import { QuotaWarningLevel as WarningLevelEnum } from './types'
import { MONITORED_SERVICES } from './constants'
import { calculateServiceWarningLevel } from './quota-monitor'
import { sendQuotaWarning } from './notification-sender'
import {
  QuotaWarningResult,
  CheckAllProjectsResult,
} from './types'

/**
 * Check quota usage and send warnings if thresholds are met
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param service - Service to check
 * @returns Warning result if warning was sent, null otherwise
 */
export async function checkAndSendQuotaWarning(
  projectId: string,
  projectName: string,
  service: string
): Promise<QuotaWarningResult | null> {
  try {
    const result = await calculateServiceWarningLevel(projectId, service)

    if (!result || !result.warningLevel) {
      return null
    }

    const warningsSent = await sendQuotaWarning(
      projectId,
      projectName,
      service,
      result.warningLevel,
      result.currentUsage,
      result.monthlyLimit,
      Math.round(result.usagePercentage * 10) / 10,
      result.resetAt
    )

    if (warningsSent > 0) {
      return {
        projectId,
        service,
        warningLevel: result.warningLevel,
        currentUsage: result.currentUsage,
        monthlyLimit: result.monthlyLimit,
        usagePercentage: Math.round(result.usagePercentage * 10) / 10,
        resetAt: result.resetAt,
        warningsSent,
      }
    }

    return null
  } catch (error) {
    console.error('[QuotaWarnings] Error checking quota warning:', error)
    return null
  }
}

/**
 * Check all services for a project and send warnings if needed
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @returns Array of warning results
 */
export async function checkAllServicesForQuotaWarnings(
  projectId: string,
  projectName: string
): Promise<QuotaWarningResult[]> {
  const warnings: QuotaWarningResult[] = []

  for (const service of MONITORED_SERVICES) {
    try {
      const result = await checkAndSendQuotaWarning(projectId, projectName, service)
      if (result) {
        warnings.push(result)
      }
    } catch (error) {
      console.error(`[QuotaWarnings] Error checking service ${service}:`, error)
    }
  }

  return warnings
}

/**
 * Background job to check all projects for quota warnings
 *
 * This function is designed to be called by a scheduled job/cron.
 * It checks all projects and sends warnings if they approach quota limits.
 *
 * @returns Summary of warnings sent
 */
export async function checkAllProjectsForQuotaWarnings(): Promise<CheckAllProjectsResult> {
  try {
    console.log('[QuotaWarnings] Starting quota warning check for all projects')

    const { getActiveProjects } = await import('./quota-monitor')
    const projects = await getActiveProjects()

    console.log(`[QuotaWarnings] Checking ${projects.length} active projects`)

    let warningsSent = 0
    const servicesChecked = projects.length * MONITORED_SERVICES.length

    // Check each project
    for (const project of projects) {
      try {
        const projectWarnings = await checkAllServicesForQuotaWarnings(
          project.id,
          project.project_name
        )
        warningsSent += projectWarnings.length
      } catch (error) {
        console.error(
          `[QuotaWarnings] Error checking project ${project.id}:`,
          error
        )
      }
    }

    console.log(
      `[QuotaWarnings] Quota warning check complete. Checked ${servicesChecked} services across ${projects.length} projects. Sent ${warningsSent} warnings.`
    )

    return {
      projectsChecked: projects.length,
      warningsSent,
      servicesChecked,
    }
  } catch (error) {
    console.error('[QuotaWarnings] Error checking all projects for quota warnings:', error)
    throw new Error('Failed to check projects for quota warnings')
  }
}

// Legacy type alias for backward compatibility
export type QuotaWarningLevel = WarningLevelEnum

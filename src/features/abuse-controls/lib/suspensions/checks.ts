/**
 * Suspensions Module - Cap Checking Functions
 */

import { HardCapType } from '../../types'
import { getCurrentUsage, checkQuota } from '../enforcement'
import { getProjectQuota } from '../quotas'
import { suspendProject, unsuspendProject } from './actions'
import { SuspensionType } from '../../types'
import { getEnvironmentConfig, type Environment } from '@/lib/environment'
import { queryActiveProjects, querySuspensionStatus, queryAllActiveSuspensions, querySuspensionHistory } from './queries'
import type { SuspensionRecord, SuspensionHistoryEntry } from './types'

/**
 * Get the suspension status of a project
 *
 * @param projectId - The project to check
 * @returns The suspension record if suspended, null otherwise
 */
export async function getSuspensionStatus(
  projectId: string
): Promise<SuspensionRecord | null> {
  try {
    return await querySuspensionStatus(projectId)
  } catch (error) {
    console.error('[Suspensions] Error getting suspension status:', error)
    throw new Error('Failed to get suspension status')
  }
}

/**
 * Check if a specific cap is exceeded for a project
 *
 * @param projectId - The project to check
 * @param capType - The cap type to check
 * @returns True if the cap is exceeded, false otherwise
 */
export async function isCapExceeded(
  projectId: string,
  capType: HardCapType
): Promise<boolean> {
  try {
    const currentUsage = await getCurrentUsage(projectId, capType)
    const check = await checkQuota(projectId, capType, currentUsage)

    return !check.allowed
  } catch (error) {
    console.error('[Suspensions] Error checking if cap exceeded:', error)
    // On error, assume not exceeded to avoid false suspensions
    return false
  }
}

/**
 * Check all projects for cap violations and suspend those exceeding limits
 *
 * This function is designed to be called by a background job/cron.
 * It iterates through all projects and checks each against their configured caps.
 *
 * US-005: Skip auto-suspend for dev and staging environments based on environment config
 *
 * @returns Array of suspension records for newly suspended projects
 */
export async function checkAllProjectsForSuspension(): Promise<
  SuspensionRecord[]
> {
  try {
    console.log('[Suspensions] Starting cap violation check for all projects')

    const projects = await queryActiveProjects()
    console.log(`[Suspensions] Checking ${projects.length} active projects`)

    const newlySuspended: SuspensionRecord[] = []
    let suspensionsMade = 0
    let skippedForEnvironment = 0

    // Check each project for cap violations
    for (const project of projects) {
      const projectId = project.id
      const projectEnv = (project.environment || 'prod') as Environment

      // Get environment config to check if auto-suspend is enabled
      const envConfig = getEnvironmentConfig(projectEnv)

      // Skip auto-suspend for dev and staging environments
      if (!envConfig.auto_suspend_enabled) {
        console.log(
          `[Suspensions] Skipping project ${projectId} in ${projectEnv} environment (auto-suspend disabled)`
        )
        skippedForEnvironment++
        continue
      }

      try {
        // Check all cap types for this project
        const capTypes = Object.values(HardCapType)

        for (const capType of capTypes) {
          const exceeded = await isCapExceeded(projectId, capType)

          if (exceeded) {
            // Get the quota details for the suspension reason
            const quota = await getProjectQuota(projectId, capType)
            const currentUsage = await getCurrentUsage(projectId, capType)

            const reason = {
              cap_type: capType,
              current_value: currentUsage,
              limit_exceeded: quota?.cap_value || 0,
              details: `Project exceeded ${capType} limit`,
            }

            // Suspend the project with automatic suspension type
            await suspendProject(
              projectId,
              reason,
              'Auto-suspended by background job',
              SuspensionType.AUTOMATIC
            )

            // Get the suspension record
            const suspension = await getSuspensionStatus(projectId)

            if (suspension) {
              newlySuspended.push(suspension)
              suspensionsMade++
            }

            // Break out of cap type loop since project is now suspended
            break
          }
        }
      } catch (error) {
        console.error(
          `[Suspensions] Error checking project ${projectId}:`,
          error
        )
        // Continue with next project
      }
    }

    console.log(
      `[Suspensions] Cap violation check complete. ${suspensionsMade} project(s) suspended. ${skippedForEnvironment} project(s) skipped (dev/staging environment).`
    )

    return newlySuspended
  } catch (error) {
    console.error('[Suspensions] Error checking all projects for suspension:', error)
    throw new Error('Failed to check projects for suspension')
  }
}

/**
 * Get all active suspensions
 *
 * @returns Array of all active suspension records
 */
export async function getAllActiveSuspensions(): Promise<
  SuspensionRecord[]
> {
  try {
    return await queryAllActiveSuspensions()
  } catch (error) {
    console.error('[Suspensions] Error getting active suspensions:', error)
    throw new Error('Failed to get active suspensions')
  }
}

/**
 * Get suspension history for a project
 *
 * @param projectId - The project to get history for
 * @returns Array of history entries
 */
export async function getSuspensionHistory(
  projectId: string
): Promise<SuspensionHistoryEntry[]> {
  try {
    return await querySuspensionHistory(projectId)
  } catch (error) {
    console.error('[Suspensions] Error getting suspension history:', error)
    throw new Error('Failed to get suspension history')
  }
}

export { suspendProject, unsuspendProject }

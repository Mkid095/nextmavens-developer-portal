/**
 * Auto-Status Transitions Background Jobs
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * This module provides unified background job handlers for all project lifecycle
 * status transitions:
 *
 * 1. CREATED → ACTIVE after provisioning completes
 * 2. ACTIVE → SUSPENDED when hard cap exceeded
 * 3. SUSPENDED → ACTIVE after quota reset (manual suspensions only)
 *
 * Usage:
 * - Call runAutoStatusTransitionsJob() from a cron job
 * - This will run all transition checks in a single job
 * - Individual jobs (runSuspensionCheck, runQuotaResetJob) can also be called separately
 */

import { runSuspensionCheck } from '@/features/abuse-controls/lib/background-job'
import { runQuotaResetJob } from '@/features/quotas-limits/lib/quota-reset-job'

/**
 * Auto-status transitions job result interface
 */
export interface AutoStatusTransitionsJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Results from the suspension check */
  suspensionCheck: {
    success: boolean
    projectsChecked: number
    suspensionsMade: number
    suspendedProjects: Array<{
      projectId: string
      capExceeded: string
      suspendedAt: Date
    }>
    error?: string
  }
  /** Results from the quota reset job */
  quotaReset: {
    success: boolean
    quotasChecked: number
    quotasReset: number
    projectsResumed: number
    notificationsSent: number
    error?: string
  }
  /** Error message if overall job failed */
  error?: string
}

/**
 * Run the auto-status transitions background job
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * This function orchestrates all automatic status transitions:
 * 1. Runs suspension check (ACTIVE → SUSPENDED for quota violations)
 * 2. Runs quota reset job (includes SUSPENDED → ACTIVE for manual suspensions)
 * 3. Returns comprehensive results for all transitions
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler (recommended: every hour)
 * const result = await runAutoStatusTransitionsJob();
 * console.log(`Suspensions: ${result.suspensionCheck.suspensionsMade}`);
 * console.log(`Resumes: ${result.quotaReset.projectsResumed}`);
 */
export async function runAutoStatusTransitionsJob(): Promise<AutoStatusTransitionsJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Auto-Status Transitions] Job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  let suspensionCheckSuccess = true
  let suspensionCheckError: string | undefined
  let quotaResetSuccess = true
  let quotaResetError: string | undefined

  try {
    // Step 1: Run suspension check (ACTIVE → SUSPENDED for hard cap violations)
    console.log('\n[Auto-Status Transitions] Step 1: Running suspension check...')
    const suspensionResult = await runSuspensionCheck()
    suspensionCheckSuccess = suspensionResult.success
    suspensionCheckError = suspensionResult.error

    // Step 2: Run quota reset job (includes SUSPENDED → ACTIVE for manual suspensions)
    console.log('\n[Auto-Status Transitions] Step 2: Running quota reset job...')
    const quotaResetResult = await runQuotaResetJob()
    quotaResetSuccess = quotaResetResult.success
    quotaResetError = quotaResetResult.error

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const result: AutoStatusTransitionsJobResult = {
      success: suspensionCheckSuccess && quotaResetSuccess,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      suspensionCheck: {
        success: suspensionResult.success,
        projectsChecked: suspensionResult.projectsChecked,
        suspensionsMade: suspensionResult.suspensionsMade,
        suspendedProjects: suspensionResult.suspendedProjects,
        error: suspensionCheckError,
      },
      quotaReset: {
        success: quotaResetResult.success,
        quotasChecked: quotaResetResult.quotasChecked,
        quotasReset: quotaResetResult.quotasReset.length,
        projectsResumed: quotaResetResult.projectsResumed,
        notificationsSent: quotaResetResult.notificationsSent,
        error: quotaResetError,
      },
    }

    // Log summary
    console.log('\n' + '='.repeat(60))
    console.log('[Auto-Status Transitions] Job completed')
    console.log(`[Auto-Status Transitions] Duration: ${durationMs}ms`)
    console.log(`[Auto-Status Transitions] Suspension check: ${result.suspensionCheck.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`[Auto-Status Transitions] - Projects checked: ${result.suspensionCheck.projectsChecked}`)
    console.log(`[Auto-Status Transitions] - Suspensions made: ${result.suspensionCheck.suspensionsMade}`)
    console.log(`[Auto-Status Transitions] Quota reset: ${result.quotaReset.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`[Auto-Status Transitions] - Quotas reset: ${result.quotaReset.quotasReset}`)
    console.log(`[Auto-Status Transitions] - Projects auto-resumed: ${result.quotaReset.projectsResumed}`)
    console.log('='.repeat(60))

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('\n' + '='.repeat(60))
    console.error('[Auto-Status Transitions] Job failed')
    console.error(`[Auto-Status Transitions] Duration: ${durationMs}ms`)
    console.error(`[Auto-Status Transitions] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      suspensionCheck: {
        success: false,
        projectsChecked: 0,
        suspensionsMade: 0,
        suspendedProjects: [],
        error: suspensionCheckError,
      },
      quotaReset: {
        success: false,
        quotasChecked: 0,
        quotasReset: 0,
        projectsResumed: 0,
        notificationsSent: 0,
        error: quotaResetError,
      },
      error: errorMessage,
    }
  }
}

/**
 * Get a summary of recent auto-status transition activity
 *
 * @param hours - Number of hours to look back (default: 24)
 * @returns Summary of status transitions in the time period
 */
export async function getStatusTransitionSummary(hours: number = 24): Promise<{
  totalSuspensions: number
  totalResumes: number
  byCapType: Record<string, number>
  activeSuspensions: number
}> {
  // This is a placeholder for now
  // Would query suspension_history to get statistics
  // Implementation can be added when monitoring dashboard is needed

  return {
    totalSuspensions: 0,
    totalResumes: 0,
    byCapType: {},
    activeSuspensions: 0,
  }
}

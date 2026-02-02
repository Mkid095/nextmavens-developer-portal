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

import { getPool } from '@/lib/db'
import { runSuspensionCheck } from '@/features/abuse-controls/lib/background-job'
import { runQuotaResetJob } from '@/features/quotas-limits/lib/quota-reset-job'
import { runAutoActivationJob } from '@/features/project-lifecycle/lib/auto-activation-job'

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
  /** Results from the auto-activation check */
  autoActivation: {
    success: boolean
    projectsChecked: number
    projectsActivated: number
    activatedProjects: Array<{
      projectId: string
      projectName: string
      activatedAt: Date
    }>
    failedProvisioning: number
    error?: string
  }
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
 * 1. Runs auto-activation check (CREATED → ACTIVE after provisioning)
 * 2. Runs suspension check (ACTIVE → SUSPENDED for quota violations)
 * 3. Runs quota reset job (includes SUSPENDED → ACTIVE for manual suspensions)
 * 4. Returns comprehensive results for all transitions
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler (recommended: every hour)
 * const result = await runAutoStatusTransitionsJob();
 * console.log(`Activations: ${result.autoActivation.projectsActivated}`);
 * console.log(`Suspensions: ${result.suspensionCheck.suspensionsMade}`);
 * console.log(`Resumes: ${result.quotaReset.projectsResumed}`);
 */
export async function runAutoStatusTransitionsJob(): Promise<AutoStatusTransitionsJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Auto-Status Transitions] Job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  let autoActivationSuccess = true
  let autoActivationError: string | undefined
  let suspensionCheckSuccess = true
  let suspensionCheckError: string | undefined
  let quotaResetSuccess = true
  let quotaResetError: string | undefined

  try {
    // Step 1: Run auto-activation check (CREATED → ACTIVE after provisioning completes)
    console.log('\n[Auto-Status Transitions] Step 1: Running auto-activation check...')
    const autoActivationResult = await runAutoActivationJob()
    autoActivationSuccess = autoActivationResult.success
    autoActivationError = autoActivationResult.error

    // Step 2: Run suspension check (ACTIVE → SUSPENDED for hard cap violations)
    console.log('\n[Auto-Status Transitions] Step 2: Running suspension check...')
    const suspensionResult = await runSuspensionCheck()
    suspensionCheckSuccess = suspensionResult.success
    suspensionCheckError = suspensionResult.error

    // Step 3: Run quota reset job (includes SUSPENDED → ACTIVE for manual suspensions)
    console.log('\n[Auto-Status Transitions] Step 3: Running quota reset job...')
    const quotaResetResult = await runQuotaResetJob()
    quotaResetSuccess = quotaResetResult.success
    quotaResetError = quotaResetResult.error

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const result: AutoStatusTransitionsJobResult = {
      success: autoActivationSuccess && suspensionCheckSuccess && quotaResetSuccess,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      autoActivation: {
        success: autoActivationResult.success,
        projectsChecked: autoActivationResult.projectsChecked,
        projectsActivated: autoActivationResult.projectsActivated,
        activatedProjects: autoActivationResult.activatedProjects,
        failedProvisioning: autoActivationResult.failedProvisioning,
        error: autoActivationError,
      },
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
    console.log(`[Auto-Status Transitions] Auto-activation: ${result.autoActivation.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`[Auto-Status Transitions] - Projects checked: ${result.autoActivation.projectsChecked}`)
    console.log(`[Auto-Status Transitions] - Projects activated: ${result.autoActivation.projectsActivated}`)
    console.log(`[Auto-Status Transitions] - Failed provisioning: ${result.autoActivation.failedProvisioning}`)
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
      autoActivation: {
        success: false,
        projectsChecked: 0,
        projectsActivated: 0,
        activatedProjects: [],
        failedProvisioning: 0,
        error: autoActivationError,
      },
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
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * @param hours - Number of hours to look back (default: 24)
 * @returns Summary of status transitions in the time period
 */
export async function getStatusTransitionSummary(hours: number = 24): Promise<{
  totalActivations: number
  totalSuspensions: number
  totalResumes: number
  byCapType: Record<string, number>
  activeSuspensions: number
}> {
  const pool = getPool()
  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - hours)

  try {
    // Count auto-activations (CREATED → ACTIVE with system actor)
    const activationsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM control_plane.audit_logs
      WHERE action = 'auto_activated'
        AND created_at >= $1
    `, [cutoffDate])

    const totalActivations = parseInt(activationsResult.rows[0].count) || 0

    // Count suspensions by cap type
    const suspensionsResult = await pool.query(`
      SELECT
        COUNT(*) as count,
        cap_exceeded
      FROM control_plane.suspensions
      WHERE created_at >= $1
        AND resolved_at IS NULL
      GROUP BY cap_exceeded
    `, [cutoffDate])

    const byCapType: Record<string, number> = {}
    let totalSuspensions = 0

    for (const row of suspensionsResult.rows) {
      const count = parseInt(row.count) || 0
      byCapType[row.cap_exceeded] = count
      totalSuspensions += count
    }

    // Count active suspensions
    const activeSuspensionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM control_plane.suspensions
      WHERE resolved_at IS NULL
    `)

    const activeSuspensions = parseInt(activeSuspensionsResult.rows[0].count) || 0

    // Count resumes (SUSPENDED → ACTIVE)
    const resumesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM control_plane.audit_logs
      WHERE action IN ('unsuspended', 'auto_resumed')
        AND metadata->>'new_status' = 'active'
        AND created_at >= $1
    `, [cutoffDate])

    const totalResumes = parseInt(resumesResult.rows[0].count) || 0

    return {
      totalActivations,
      totalSuspensions,
      totalResumes,
      byCapType,
      activeSuspensions,
    }
  } catch (error) {
    console.error('[Auto-Status Transitions] Error getting summary:', error)
    return {
      totalActivations: 0,
      totalSuspensions: 0,
      totalResumes: 0,
      byCapType: {},
      activeSuspensions: 0,
    }
  }
}

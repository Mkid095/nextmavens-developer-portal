/**
 * Spike Detection Background Job Module
 * Main background job for running spike detection
 */

import { getPool } from '@/lib/db'
import type { SpikeDetectionResult } from '../../types'
import { SpikeAction } from '../../types'
import { logBackgroundJob } from '../audit-logger'
import { checkAllProjectsForSpikes } from './spike-checker'
import { triggerSpikeAction } from './spike-actions'
import type { SpikeDetectionJobResult } from './types'

/**
 * Run the spike detection background job
 *
 * This function checks all active projects for usage spikes
 * and logs the results for monitoring and debugging.
 *
 * @returns Result object with job statistics and detected spikes
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runSpikeDetection();
 * console.log(`Job completed: ${result.spikesDetected} spikes detected`);
 */
export async function runSpikeDetection(): Promise<SpikeDetectionJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Spike Detection] Background job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Run the spike detection
    const detectedSpikes = await checkAllProjectsForSpikes()

    // Trigger actions for each detected spike
    for (const spike of detectedSpikes) {
      await triggerSpikeAction(spike)
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    // Count actions taken
    const warnings = detectedSpikes.filter((s) => s.actionTaken === SpikeAction.WARNING).length
    const suspensions = detectedSpikes.filter((s) => s.actionTaken === SpikeAction.SUSPEND).length

    // Count projects checked
    const pool = getPool()
    const projectsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'active'
      `
    )
    const projectsChecked = parseInt(projectsResult.rows[0].count)

    const result: SpikeDetectionJobResult = {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      spikesDetected: detectedSpikes.length,
      detectedSpikes,
      actionsTaken: {
        warnings,
        suspensions,
      },
    }

    // Log summary
    console.log('='.repeat(60))
    console.log(`[Spike Detection] Background job completed`)
    console.log(`[Spike Detection] Duration: ${durationMs}ms`)
    console.log(`[Spike Detection] Projects checked: ${result.projectsChecked}`)
    console.log(`[Spike Detection] Spikes detected: ${result.spikesDetected}`)
    console.log(`[Spike Detection] Actions taken:`)
    console.log(`  - Warnings: ${result.actionsTaken.warnings}`)
    console.log(`  - Suspensions: ${result.actionsTaken.suspensions}`)

    if (result.spikesDetected > 0) {
      console.log(`[Spike Detection] Detected spikes:`)
      detectedSpikes.forEach((spike, index) => {
        console.log(
          `  ${index + 1}. Project ${spike.projectId} - ${spike.capType} is ${spike.spikeMultiplier}x average (${spike.severity.toUpperCase()})`
        )
      })
    }

    console.log('='.repeat(60))

    // Log the background job execution to audit logs
    await logBackgroundJob(
      'spike_detection',
      true,
      {
        duration_ms: durationMs,
        projects_checked: result.projectsChecked,
        spikes_detected: result.spikesDetected,
        warnings: result.actionsTaken.warnings,
        suspensions: result.actionsTaken.suspensions,
        detected_spikes: detectedSpikes.map((s) => ({
          project_id: s.projectId,
          cap_type: s.capType,
          severity: s.severity,
          multiplier: s.spikeMultiplier,
        })),
      }
    ).catch((error) => {
      // Don't fail the job if logging fails
      console.error('[Spike Detection] Failed to log to audit:', error)
    })

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Spike Detection] Background job failed`)
    console.error(`[Spike Detection] Duration: ${durationMs}ms`)
    console.error(`[Spike Detection] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    // Log the failed background job execution to audit logs
    await logBackgroundJob(
      'spike_detection',
      false,
      {
        duration_ms: durationMs,
        error: errorMessage,
      }
    ).catch((logError) => {
      // Don't fail if logging fails
      console.error('[Spike Detection] Failed to log to audit:', logError)
    })

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      spikesDetected: 0,
      detectedSpikes: [],
      actionsTaken: {
        warnings: 0,
        suspensions: 0,
      },
      error: errorMessage,
    }
  }
}

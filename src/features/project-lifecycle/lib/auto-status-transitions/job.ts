/**
 * Auto Status Transitions Background Job
 *
 * Handles automatic project status transitions based on events:
 * 1. CREATED → ACTIVE after provisioning completes successfully
 * 2. ACTIVE → SUSPENDED when hard cap is exceeded
 * 3. SUSPENDED → ACTIVE after quota reset (if suspension was due to quota)
 *
 * Story: US-010 from prd-project-lifecycle.json
 */

import { getPool } from '@/lib/db'
import type { AutoStatusTransitionsJobResult, StatusTransitionResult } from './types'
import {
  transitionCreatedToActive,
  transitionActiveToSuspended,
  transitionSuspendedToActive,
} from './transitions'

/**
 * Run the auto status transitions background job
 *
 * This function checks all projects and performs automatic status transitions:
 * 1. CREATED → ACTIVE after provisioning completes
 * 2. ACTIVE → SUSPENDED when hard cap exceeded
 * 3. SUSPENDED → ACTIVE after quota reset (if quota-related suspension)
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runAutoStatusTransitionsJob();
 * console.log(`Job completed: ${result.transitionsMade} transitions made`);
 */
export async function runAutoStatusTransitionsJob(): Promise<AutoStatusTransitionsJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Auto Status Job] Started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  const pool = getPool()

  try {
    // Get all CREATED projects to check for provisioning completion
    const createdProjectsResult = await pool.query(
      `SELECT id
       FROM projects
       WHERE status = 'created'`
    )

    const createdProjects = createdProjectsResult.rows

    // Get all ACTIVE projects to check for hard cap violations
    // (This syncs status with existing suspensions)
    const activeProjectsResult = await pool.query(
      `SELECT id
       FROM projects
       WHERE status = 'active'`
    )

    const activeProjects = activeProjectsResult.rows

    // Get all SUSPENDED projects to check for quota reset
    const suspendedProjectsResult = await pool.query(
      `SELECT id
       FROM projects
       WHERE status = 'suspended'`
    )

    const suspendedProjects = suspendedProjectsResult.rows

    const projectsChecked =
      createdProjects.length + activeProjects.length + suspendedProjects.length

    console.log(`[Auto Status Job] Checking ${projectsChecked} projects`)
    console.log(
      `  - ${createdProjects.length} CREATED projects (provisioning completion)`
    )
    console.log(`  - ${activeProjects.length} ACTIVE projects (hard cap check)`)
    console.log(`  - ${suspendedProjects.length} SUSPENDED projects (quota reset)`)

    const transitions: StatusTransitionResult[] = []

    // Check CREATED projects for provisioning completion
    for (const project of createdProjects) {
      const result = await transitionCreatedToActive(project.id)
      if (result) {
        transitions.push(result)
      }
    }

    // Check ACTIVE projects for hard cap violations (sync with suspensions)
    for (const project of activeProjects) {
      const result = await transitionActiveToSuspended(project.id)
      if (result) {
        transitions.push(result)
      }
    }

    // Check SUSPENDED projects for quota reset
    for (const project of suspendedProjects) {
      const result = await transitionSuspendedToActive(project.id)
      if (result) {
        transitions.push(result)
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log(`[Auto Status Job] Completed`)
    console.log(`[Auto Status Job] Duration: ${durationMs}ms`)
    console.log(`[Auto Status Job] Projects checked: ${projectsChecked}`)
    console.log(`[Auto Status Job] Transitions made: ${transitions.length}`)

    if (transitions.length > 0) {
      console.log(`[Auto Status Job] Transitions:`)
      transitions.forEach((t, index) => {
        console.log(
          `  ${index + 1}. ${t.projectName}: ${t.previousStatus.toUpperCase()} → ${t.newStatus.toUpperCase()}`
        )
        console.log(`     Reason: ${t.reason}`)
      })
    }

    console.log('='.repeat(60))

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      transitionsMade: transitions.length,
      transitions,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Auto Status Job] Failed`)
    console.error(`[Auto Status Job] Duration: ${durationMs}ms`)
    console.error(`[Auto Status Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      transitionsMade: 0,
      transitions: [],
      error: errorMessage,
    }
  }
}

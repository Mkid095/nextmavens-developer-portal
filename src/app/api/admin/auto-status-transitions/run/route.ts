/**
 * POST /api/admin/auto-status-transitions/run
 *
 * Manually triggers the auto status transitions background job.
 * This endpoint is for administrative/testing purposes.
 *
 * The job performs automatic project status transitions:
 * 1. CREATED → ACTIVE after provisioning completes
 * 2. ACTIVE → SUSPENDED when hard cap exceeded
 * 3. SUSPENDED → ACTIVE after quota reset
 *
 * Story: US-010 from prd-project-lifecycle.json
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAutoStatusTransitionsJob } from '@/features/project-lifecycle/lib/auto-status-transitions'

/**
 * POST endpoint to run the auto status transitions job
 */
export async function POST(_req: NextRequest) {
  try {
    console.log('[Admin API] Auto status transitions job triggered manually')

    // Run the job
    const result = await runAutoStatusTransitionsJob()

    const statusCode = result.success ? 200 : 500

    return NextResponse.json(
      {
        success: result.success,
        message: result.success
          ? `Auto status transitions job completed. ${result.transitionsMade} transition(s) made.`
          : 'Auto status transitions job failed.',
        job: {
          started_at: result.startedAt,
          completed_at: result.completedAt,
          duration_ms: result.durationMs,
          projects_checked: result.projectsChecked,
          transitions_made: result.transitionsMade,
          transitions: result.transitions,
        },
        error: result.error,
      },
      { status: statusCode }
    )
  } catch (error: any) {
    console.error('[Admin API] Auto status transitions job error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to run auto status transitions job',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check job status (provides info about the job)
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    name: 'Auto Status Transitions Job',
    description:
      'Automatically transitions project statuses based on events: CREATED→ACTIVE after provisioning, ACTIVE→SUSPENDED on hard cap, SUSPENDED→ACTIVE after quota reset',
    triggers: [
      {
        name: 'Provisioning Complete',
        description: 'Transitions CREATED to ACTIVE when all provisioning steps succeed',
      },
      {
        name: 'Hard Cap Exceeded',
        description: 'Transitions ACTIVE to SUSPENDED when quota hard cap is exceeded',
      },
      {
        name: 'Quota Reset',
        description: 'Transitions SUSPENDED to ACTIVE when quota is reset (if suspension was quota-related)',
      },
    ],
    usage: {
      run: 'POST /api/admin/auto-status-transitions/run',
      description: 'Manually trigger the job to check and transition all eligible projects',
      schedule: 'Should be run periodically via cron (e.g., every 5 minutes)',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { runGracePeriodJob } from '@/features/deletion-preview/lib/grace-period-job'

/**
 * POST /api/admin/grace-period/run
 *
 * Admin endpoint to trigger the grace period background job.
 * This is designed to be called by a cron job or scheduler.
 *
 * The job:
 * - Checks for projects approaching 7-day warning threshold
 * - Checks for projects with expired grace periods
 * - Hard deletes projects whose grace period has ended
 *
 * US-008: Implement 30-Day Grace Period
 */
export async function POST(req: NextRequest) {
  const correlationId = withCorrelationId(req)

  try {
    // Authenticate as admin (requires valid JWT token)
    await authenticateRequest(req)

    // Run the grace period job
    const result = await runGracePeriodJob()

    const response = {
      success: result.success,
      message: result.success
        ? `Grace period job completed: ${result.projectsHardDeleted.length} projects hard deleted, ${result.projectsNeedingNotification.length} need 7-day warning`
        : 'Grace period job failed',
      result: {
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        durationMs: result.durationMs,
        projectsChecked: result.projectsChecked,
        projectsNearExpiration: result.projectsNearExpiration.length,
        projectsNeedingNotification: result.projectsNeedingNotification,
        projectsHardDeleted: result.projectsHardDeleted,
      },
      error: result.error,
    }

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Grace Period Job API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run grace period job' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { runQuotaResetJob } from '@/features/quotas-limits/lib/quota-reset-job'

/**
 * POST /api/admin/quota-reset/run
 *
 * Admin endpoint to trigger the quota reset background job.
 * This is designed to be called by a cron job or scheduler.
 *
 * The job:
 * - Finds quotas whose reset_at date has passed
 * - Updates reset_at to next month for those quotas
 * - Archives usage snapshots older than retention period
 * - Sends notification emails to project owners
 *
 * US-008: Implement Quota Reset
 */
export async function POST(req: NextRequest) {
  const correlationId = withCorrelationId(req)

  try {
    // Authenticate as admin (requires valid JWT token)
    await authenticateRequest(req)

    // Optional: Get retention period from query params (default: 3 months)
    const url = new URL(req.url)
    const retentionMonthsParam = url.searchParams.get('retention_months')
    const retentionMonths = retentionMonthsParam ? parseInt(retentionMonthsParam, 10) : 3

    if (isNaN(retentionMonths) || retentionMonths < 1) {
      return NextResponse.json(
        { error: 'retention_months must be a positive integer' },
        { status: 400 }
      )
    }

    // Run the quota reset job
    const result = await runQuotaResetJob(retentionMonths)

    const response = {
      success: result.success,
      message: result.success
        ? `Quota reset job completed: ${result.quotasReset.length} quotas reset, ${result.notificationsSent} notifications sent, ${result.snapshotsArchived} snapshots archived`
        : 'Quota reset job failed',
      result: {
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        durationMs: result.durationMs,
        quotasChecked: result.quotasChecked,
        quotasReset: result.quotasReset.length,
        snapshotsArchived: result.snapshotsArchived,
        notificationsSent: result.notificationsSent,
        notificationsFailed: result.notificationsFailed,
      },
      error: result.error,
    }

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Quota Reset Job API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run quota reset job' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * GET /api/admin/quota-reset/run
 *
 * Get the status of quotas that need to be reset (without running the job).
 * This is useful for monitoring dashboards.
 */
export async function GET(req: NextRequest) {
  const correlationId = withCorrelationId(req)

  try {
    // Authenticate as admin
    await authenticateRequest(req)

    // Import getQuotasNeedingReset function
    const { getQuotasNeedingReset } = await import('@/features/quotas-limits/lib/quota-reset-job')

    // Get quotas that need reset
    const quotasNeedingReset = await getQuotasNeedingReset()

    const response = {
      success: true,
      quotasNeedingReset: quotasNeedingReset.length,
      quotas: quotasNeedingReset.map((quota) => ({
        projectId: quota.projectId,
        projectName: quota.projectName,
        projectSlug: quota.projectSlug,
        service: quota.service,
        resetAt: quota.resetAt,
        monthlyLimit: quota.monthlyLimit,
      })),
    }

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Quota Reset Status API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get quota reset status' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

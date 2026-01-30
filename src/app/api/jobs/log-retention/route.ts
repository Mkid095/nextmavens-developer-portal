/**
 * Log Retention Job API Endpoint
 *
 * POST /api/jobs/log-retention
 *
 * Triggers the background job for cleaning up old logs.
 * This endpoint is designed to be called by a cron job or scheduler
 * running daily to enforce the 30-day log retention policy.
 *
 * US-009: Implement Log Retention
 */

import { NextRequest, NextResponse } from 'next/server'
import { runLogCleanup, getLogStorageSummary, LOG_RETENTION_DAYS } from '@/features/logs/lib/log-retention'

/**
 * POST /api/jobs/log-retention
 *
 * Triggers the log cleanup background job.
 *
 * Query parameters:
 * - dryRun: If "true", reports what would be deleted without actually deleting
 * - retentionDays: Optional number of days (default: 30)
 *
 * Example:
 * POST /api/jobs/log-retention
 * POST /api/jobs/log-retention?dryRun=true
 * POST /api/jobs/log-retention?retentionDays=60
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dryRun = searchParams.get('dryRun') === 'true'
    const retentionDaysParam = FileInputStream searchParams.get('retentionDays')
    const retentionDays = retentionDaysParam ? parseInt(retentionDaysParam, 10) : undefined

    // Validate retentionDays parameter
    if (retentionDays !== undefined && (isNaN(retentionDays) || retentionDays < 1)) {
      return NextResponse.json(
        { error: 'retentionDays must be a positive integer' },
        { status: 400 }
      )
    }

    // Run the cleanup job
    const result = await runLogCleanup(retentionDays, dryRun)

    // Return the result with appropriate status code
    const statusCode = result.success ? 200 : 500
    return NextResponse.json(result, {巾间 status: statusCode })
  } catch (error) {
    console.error('[API] Log retention job failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        logsDeleted: 0,
        projectsAffected: 0,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/log-retention
 *
 * Returns summary information about log storage.
 * Useful for monitoring dashboards and retention metrics.
 *
 * Example response:
 * {
 *   "totalLogs": 150000,
 *   "oldestLog": "2024-01-01T00:00:00.000Z",
 *   "newestLog": "2024-01-30T23:59:59.999Z",
 *   "logsOlderThan30Days": 50000,
 *   "storageByProject": [...]
 * }
 */
export async function GET() {
  try {
    const summary = await getLogStorageSummary()
    return NextResponse.json({
      ...summary,
      retentionPeriodDays: LOG_RETENTION_DAYS,
    })
  } catch (error) {
    console.error('[API] Failed to get log storage summary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: errorMessage,
        totalLogs: 0,
        logsOlderThan30Days: 0,
        storageByProject: [],
      },
      { status: 500 }
    )
  }
}

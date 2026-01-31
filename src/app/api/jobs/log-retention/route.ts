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
import { runLogRetentionJob, getLogRetentionStats, DEFAULT_RETENTION_DAYS, type LogRetentionStats } from '@/features/logs/lib/log-retention-job'

/**
 * POST /api/jobs/log-retention
 *
 * Triggers the log cleanup background job.
 *
 * Query parameters:
 * - retentionDays: Optional number of days (default: 30)
 *
 * Example:
 * POST /api/jobs/log-retention
 * POST /api/jobs/log-retention?retentionDays=60
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const retentionDaysParam = searchParams.get('retentionDays')
    const retentionDays = retentionDaysParam ? parseInt(retentionDaysParam, 10) : DEFAULT_RETENTION_DAYS

    // Validate retentionDays parameter
    if (isNaN(retentionDays) || retentionDays < 1) {
      return NextResponse.json(
        { error: 'retentionDays must be a positive integer' },
        { status: 400 }
      )
    }

    // Run the cleanup job
    const result = await runLogRetentionJob(retentionDays)

    // Return the result with appropriate status code
    const statusCode = result.success ? 200 : 500
    return NextResponse.json(result, { status: statusCode })
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
 * Returns summary information about log storage and retention.
 * Useful for monitoring dashboards and retention metrics.
 *
 * Query parameters:
 * - retentionDays: Optional number of days (default: 30)
 *
 * Example response:
 * {
 *   "totalLogs": 150000,
 *   "oldestLog": "2024-01-01T00:00:00.000Z",
 *   "newestLog": "2024-01-30T23:59:59.999Z",
 *   "logsToDelete": 50000,
 *   "projectsAffected": 5,
 *   "cutoffDate": "2023-12-31T00:00:00.000Z"
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const retentionDaysParam = searchParams.get('retentionDays')
    const retentionDays = retentionDaysParam ? parseInt(retentionDaysParam, 10) : DEFAULT_RETENTION_DAYS

    // Validate retentionDays parameter
    if (isNaN(retentionDays) || retentionDays < 1) {
      return NextResponse.json(
        { error: 'retentionDays must be a positive integer' },
        { status: 400 }
      )
    }

    const stats: LogRetentionStats = await getLogRetentionStats(retentionDays)
    return NextResponse.json({
      ...stats,
      retentionPeriodDays: retentionDays,
    })
  } catch (error) {
    console.error('[API] Failed to get log retention stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: errorMessage,
        totalLogs: 0,
        logsToDelete: 0,
        projectsAffected: 0,
        cutoffDate: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

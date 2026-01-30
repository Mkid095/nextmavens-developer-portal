/**
 * POST /api/internal/logs/retention
 *
 * Internal API endpoint to manually trigger the log retention background job.
 * This is designed to be called by cron jobs or schedulers.
 *
 * US-009: Implement Log Retention
 */

import { NextRequest, NextResponse } from 'next/server'
import { runLogRetentionJob, getLogRetentionStats } from '@/features/logs'
import type { LogRetentionJobResult } from '@/features/logs'

/**
 * POST endpoint to trigger log retention job
 *
 * This endpoint can be called by:
 * - Cron jobs (e.g., daily at midnight)
 * - Manual admin operations
 * - Monitoring systems
 *
 * Request body (optional):
 * {
 *   "retentionDays": 30  // Number of days to retain logs (default: 30)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "logsDeleted": 1234,
 *   "projectsAffected": 5,
 *   "durationMs": 1234,
 *   "cutoffDate": "2024-01-01T00:00:00.000Z"
 * }
 */
export async function POST(request: NextRequest) {
  // Simple authentication via API key for internal calls
  const authHeader = request.headers.get('authorization')
  const internalApiKey = process.env.INTERNAL_API_KEY

  // Skip auth for development if INTERNAL_API_KEY is not set
  if (internalApiKey && authHeader !== `Bearer ${internalApiKey}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Parse request body for optional retentionDays parameter
    let retentionDays = 30 // Default 30 days

    try {
      const body = await request.json()
      if (typeof body.retentionDays === 'number' && body.retentionDays > 0) {
        retentionDays = body.retentionDays
      }
    } catch {
      // No body provided, use default
    }

    // Run the log retention job
    const result: LogRetentionJobResult = await runLogRetentionJob(retentionDays)

    if (result.success) {
      return NextResponse.json({
        success: true,
        logsDeleted: result.logsDeleted,
        projectsAffected: result.projectsAffected,
        durationMs: result.durationMs,
        cutoffDate: result.cutoffDate.toISOString(),
        startedAt: result.startedAt.toISOString(),
        completedAt: result.completedAt.toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          durationMs: result.durationMs,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Log Retention API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to get log retention statistics
 *
 * This endpoint returns statistics about the current state of logs
 * and how many would be deleted if the retention job ran.
 *
 * Query parameters:
 * - retentionDays: Number of days to retain logs (default: 30)
 *
 * Response:
 * {
 *   "totalLogs": 10000,
 *   "logsToDelete": 2345,
 *   "projectsAffected": 5,
 *   "cutoffDate": "2024-01-01T00:00:00.000Z",
 *   "oldestLog": "2023-12-01T00:00:00.000Z",
 *   "newestLog": "2024-01-30T12:34:56.789Z"
 * }
 */
export async function GET(request: NextRequest) {
  // Simple authentication via API key for internal calls
  const authHeader = request.headers.get('authorization')
  const internalApiKey = process.env.INTERNAL_API_KEY

  // Skip auth for development if INTERNAL_API_KEY is not set
  if (internalApiKey && authHeader !== `Bearer ${internalApiKey}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Parse retentionDays from query parameter
    const searchParams = request.nextUrl.searchParams
    const retentionDaysParam = searchParams.get('retentionDays')
    const retentionDays = retentionDaysParam ? parseInt(retentionDaysParam, 10) : 30

    if (isNaN(retentionDays) || retentionDays <= 0) {
      return NextResponse.json(
        { error: 'Invalid retentionDays parameter' },
        { status: 400 }
      )
    }

    // Get retention statistics
    const stats = await getLogRetentionStats(retentionDays)

    return NextResponse.json({
      totalLogs: stats.totalLogs,
      logsToDelete: stats.logsToDelete,
      projectsAffected: stats.projectsAffected,
      cutoffDate: stats.cutoffDate.toISOString(),
      oldestLog: stats.oldestLog?.toISOString(),
      newestLog: stats.newestLog?.toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Log Retention API] Error:', error)

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

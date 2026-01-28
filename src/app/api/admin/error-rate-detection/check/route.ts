import { NextRequest, NextResponse } from 'next/server'
import { runErrorRateDetection } from '@/features/abuse-controls/lib/error-rate-detection'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  logBackgroundJob,
  logManualIntervention,
  extractClientIP,
  extractUserAgent,
  logRateLimitExceeded,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  extractClientIP as extractIP,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'

/**
 * POST /api/admin/error-rate-detection/check
 * Trigger immediate error rate detection check (for operators)
 *
 * This endpoint allows platform operators to manually trigger
 * the error rate detection background job on demand.
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 *
 * Returns results of the check including:
 * - Whether the job completed successfully
 * - How many projects were checked
 * - How many high error rates were detected
 * - Breakdown by action type (warnings/investigations)
 * - Details of detected error rates
 */
export async function POST(req: NextRequest) {
  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Require operator or admin role
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    // Apply rate limiting: 10 requests per hour per operator
    const rateLimitIdentifier: RateLimitIdentifier = {
      type: RateLimitIdentifierType.ORG,
      value: authorizedDeveloper.id,
    }

    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      10, // 10 requests
      60 * 60 * 1000 // 1 hour window
    )

    if (!rateLimitResult.allowed) {
      await logRateLimitExceeded(
        authorizedDeveloper.id,
        'manual_error_rate_detection_check',
        10,
        clientIP
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many manual error rate detection check requests. Please try again later.',
          retry_after: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    console.log('[Admin API] Manual error rate detection check triggered by', authorizedDeveloper.email)

    // Run the error rate detection
    const result = await runErrorRateDetection()

    // Log the manual intervention
    await logManualIntervention(
      'system',
      authorizedDeveloper.id,
      'Manual error rate detection check triggered',
      {
        success: result.success,
        duration_ms: result.durationMs,
        error_rates_detected: result.errorRatesDetected,
        ip_address: clientIP,
        user_agent: userAgent,
      }
    )

    // Log the background job execution
    await logBackgroundJob(
      'error_rate_detection',
      result.success,
      {
        triggered_by: authorizedDeveloper.id,
        duration_ms: result.durationMs,
        projects_checked: result.projectsChecked,
        error_rates_detected: result.errorRatesDetected,
        warnings: result.actionsTaken.warnings,
        investigations: result.actionsTaken.investigations,
        detected_error_rates: result.detectedErrorRates.map((r) => ({
          project_id: r.projectId,
          error_rate: r.errorRate,
          severity: r.severity,
          total_requests: r.totalRequests,
          error_count: r.errorCount,
        })),
      }
    )

    if (result.success) {
      return NextResponse.json(
        {
          message: 'Error rate detection check completed successfully',
          result: {
            success: result.success,
            started_at: result.startedAt,
            completed_at: result.completedAt,
            duration_ms: result.durationMs,
            projects_checked: result.projectsChecked,
            error_rates_detected: result.errorRatesDetected,
            actions_taken: result.actionsTaken,
            detected_error_rates: result.detectedErrorRates.map((detection) => ({
              project_id: detection.projectId,
              error_rate: detection.errorRate,
              total_requests: detection.totalRequests,
              error_count: detection.errorCount,
              severity: detection.severity,
              recommended_action: detection.recommendedAction,
              detected_at: detection.detectedAt,
            })),
          },
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          error: 'Error rate detection check failed',
          result: {
            success: result.success,
            started_at: result.startedAt,
            completed_at: result.completedAt,
            duration_ms: result.durationMs,
            error: result.error,
          },
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('[Admin API] Error rate detection check error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_error_rate_detection_check',
        errorMessage,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Log authorization failures
    if (error instanceof Error && error.name === 'AuthorizationError') {
      const authError = error as Error & { developerId?: string }
      await logAuthFailure(
        authError.developerId || null,
        'manual_error_rate_detection_check',
        errorMessage,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to run error rate detection check',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/error-rate-detection/check
 * Get information about the error rate detection check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/error-rate-detection/check',
    method: 'POST',
    description: 'Trigger immediate error rate detection check for all projects',
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      response: {
        success: 'boolean',
        started_at: 'ISO datetime',
        completed_at: 'ISO datetime',
        duration_ms: 'number',
        projects_checked: 'number',
        error_rates_detected: 'number',
        actions_taken: {
          warnings: 'number',
          investigations: 'number',
        },
        detected_error_rates: 'array of error rate detection details',
      },
    },
  })
}

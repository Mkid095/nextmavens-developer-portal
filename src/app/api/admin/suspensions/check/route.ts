import { NextRequest, NextResponse } from 'next/server'
import { runSuspensionCheck } from '@/features/abuse-controls/lib/background-job'
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
 * POST /api/admin/suspensions/check
 * Trigger immediate suspension check (for operators)
 *
 * This endpoint allows platform operators to manually trigger
 * the suspension check background job on demand.
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 *
 * Returns results of the check including:
 * - Whether the job completed successfully
 * - How many projects were checked
 * - How many suspensions were made
 * - Details of suspended projects
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
        'manual_suspension_check',
        10,
        clientIP
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many manual suspension check requests. Please try again later.',
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

    console.log('[Admin API] Manual suspension check triggered by', authorizedDeveloper.email)

    // Run the suspension check
    const result = await runSuspensionCheck()

    // Log the manual intervention
    await logManualIntervention(
      'system',
      authorizedDeveloper.id,
      'Manual suspension check triggered',
      {
        success: result.success,
        duration_ms: result.durationMs,
        suspensions_made: result.suspensionsMade,
        ip_address: clientIP,
        user_agent: userAgent,
      }
    )

    // Log the background job execution
    await logBackgroundJob(
      'suspension_check',
      result.success,
      {
        triggered_by: authorizedDeveloper.id,
        duration_ms: result.durationMs,
        projects_checked: result.projectsChecked,
        suspensions_made: result.suspensionsMade,
        suspended_projects: result.suspendedProjects,
      }
    )

    if (result.success) {
      return NextResponse.json(
        {
          message: 'Suspension check completed successfully',
          result: {
            success: result.success,
            started_at: result.startedAt,
            completed_at: result.completedAt,
            duration_ms: result.durationMs,
            projects_checked: result.projectsChecked,
            suspensions_made: result.suspensionsMade,
            suspended_projects: result.suspendedProjects,
          },
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          error: 'Suspension check failed',
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
  } catch (error: any) {
    console.error('[Admin API] Suspension check error:', error)

    // Log authentication failures
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_suspension_check',
        error.message,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Log authorization failures
    if (error.name === 'AuthorizationError') {
      await logAuthFailure(
        error.developerId || null,
        'manual_suspension_check',
        error.message,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to run suspension check',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/suspensions/check
 * Get information about the suspension check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/suspensions/check',
    method: 'POST',
    description: 'Trigger immediate suspension check for all projects',
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
        suspensions_made: 'number',
        suspended_projects: 'array of project details',
      },
    },
  })
}

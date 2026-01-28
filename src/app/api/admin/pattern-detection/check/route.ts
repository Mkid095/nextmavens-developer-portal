import { NextRequest, NextResponse } from 'next/server'
import { runPatternDetection } from '@/features/abuse-controls/lib/pattern-detection'
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
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'

/**
 * POST /api/admin/pattern-detection/check
 * Trigger immediate malicious pattern detection check (for operators)
 *
 * This endpoint allows platform operators to manually trigger
 * the malicious pattern detection background job on demand.
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 *
 * Returns results of the check including:
 * - Whether the job completed successfully
 * - How many projects were checked
 * - How many malicious patterns were detected
 * - Breakdown by action type (warnings/suspensions)
 * - Details of detected patterns
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
        'manual_pattern_detection_check',
        10,
        clientIP
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many manual pattern detection check requests. Please try again later.',
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

    console.log('[Admin API] Manual pattern detection check triggered by', authorizedDeveloper.email)

    // Run the pattern detection
    const result = await runPatternDetection()

    // Log the manual intervention
    await logManualIntervention(
      'system',
      authorizedDeveloper.id,
      'Manual pattern detection check triggered',
      {
        success: result.success,
        duration_ms: result.duration_ms,
        patterns_detected: result.patterns_detected,
        ip_address: clientIP,
        user_agent: userAgent,
      }
    ).catch((error) => {
      // Don't fail the request if logging fails
      console.error('[Admin API] Failed to log manual intervention:', error)
    })

    // Log the background job execution
    await logBackgroundJob(
      'pattern_detection',
      result.success,
      {
        triggered_by: authorizedDeveloper.id,
        duration_ms: result.duration_ms,
        projects_checked: result.projects_checked,
        patterns_detected: result.patterns_detected,
        warnings: result.actions_taken.warnings,
        suspensions: result.actions_taken.suspensions,
        detected_patterns: result.detected_patterns.map((p) => ({
          project_id: p.project_id,
          pattern_type: p.pattern_type,
          severity: p.severity,
          occurrence_count: p.occurrence_count,
        })),
      }
    ).catch((error) => {
      // Don't fail the request if logging fails
      console.error('[Admin API] Failed to log background job:', error)
    })

    if (result.success) {
      return NextResponse.json(
        {
          message: 'Pattern detection check completed successfully',
          result: {
            success: result.success,
            started_at: result.started_at,
            completed_at: result.completed_at,
            duration_ms: result.duration_ms,
            projects_checked: result.projects_checked,
            patterns_detected: result.patterns_detected,
            patterns_by_type: result.patterns_by_type,
            actions_taken: result.actions_taken,
            detected_patterns: result.detected_patterns.map((pattern) => ({
              project_id: pattern.project_id,
              pattern_type: pattern.pattern_type,
              severity: pattern.severity,
              occurrence_count: pattern.occurrence_count,
              detection_window_ms: pattern.detection_window_ms,
              description: pattern.description,
              evidence: pattern.evidence,
              action_taken: pattern.action_taken,
              detected_at: pattern.detected_at,
            })),
          },
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          error: 'Pattern detection check failed',
          result: {
            success: result.success,
            started_at: result.started_at,
            completed_at: result.completed_at,
            duration_ms: result.duration_ms,
            error: result.error,
          },
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('[Admin API] Pattern detection check error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_pattern_detection_check',
        errorMessage,
        undefined,
        clientIP
      ).catch((logError) => {
        console.error('[Admin API] Failed to log auth failure:', logError)
      })
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
        'manual_pattern_detection_check',
        errorMessage,
        undefined,
        clientIP
      ).catch((logError) => {
        console.error('[Admin API] Failed to log auth failure:', logError)
      })
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to run pattern detection check',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/pattern-detection/check
 * Get information about the pattern detection check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/pattern-detection/check',
    method: 'POST',
    description: 'Trigger immediate malicious pattern detection check for all projects',
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
        patterns_detected: 'number',
        patterns_by_type: {
          sql_injection: 'number',
          auth_brute_force: 'number',
          rapid_key_creation: 'number',
        },
        actions_taken: {
          warnings: 'number',
          suspensions: 'number',
        },
        detected_patterns: 'array of pattern detection details',
      },
    },
  })
}

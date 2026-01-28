import { NextRequest, NextResponse } from 'next/server'
import { runSpikeDetection } from '@/features/abuse-controls/lib/spike-detection'
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
 * POST /api/admin/spike-detection/check
 * Trigger immediate spike detection check (for operators)
 *
 * This endpoint allows platform operators to manually trigger
 * the spike detection background job on demand.
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 *
 * Returns results of the check including:
 * - Whether the job completed successfully
 * - How many projects were checked
 * - How many spikes were detected
 * - Breakdown by action type (warnings/suspensions)
 * - Details of detected spikes
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
        'manual_spike_detection_check',
        10,
        clientIP
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many manual spike detection check requests. Please try again later.',
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

    console.log('[Admin API] Manual spike detection check triggered by', authorizedDeveloper.email)

    // Run the spike detection
    const result = await runSpikeDetection()

    // Log the manual intervention
    await logManualIntervention(
      'system',
      authorizedDeveloper.id,
      'Manual spike detection check triggered',
      {
        success: result.success,
        duration_ms: result.durationMs,
        spikes_detected: result.spikesDetected,
        ip_address: clientIP,
        user_agent: userAgent,
      }
    )

    // Log the background job execution
    await logBackgroundJob(
      'spike_detection',
      result.success,
      {
        triggered_by: authorizedDeveloper.id,
        duration_ms: result.durationMs,
        projects_checked: result.projectsChecked,
        spikes_detected: result.spikesDetected,
        warnings: result.actionsTaken.warnings,
        suspensions: result.actionsTaken.suspensions,
        detected_spikes: result.detectedSpikes.map((s) => ({
          project_id: s.projectId,
          cap_type: s.capType,
          severity: s.severity,
          multiplier: s.spikeMultiplier,
        })),
      }
    )

    if (result.success) {
      return NextResponse.json(
        {
          message: 'Spike detection check completed successfully',
          result: {
            success: result.success,
            started_at: result.startedAt,
            completed_at: result.completedAt,
            duration_ms: result.durationMs,
            projects_checked: result.projectsChecked,
            spikes_detected: result.spikesDetected,
            actions_taken: result.actionsTaken,
            detected_spikes: result.detectedSpikes.map((spike) => ({
              project_id: spike.projectId,
              cap_type: spike.capType,
              current_usage: spike.currentUsage,
              average_usage: spike.averageUsage,
              spike_multiplier: spike.spikeMultiplier,
              severity: spike.severity,
              action_taken: spike.actionTaken,
              detected_at: spike.detectedAt,
            })),
          },
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          error: 'Spike detection check failed',
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
    console.error('[Admin API] Spike detection check error:', error)

    // Log authentication failures
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_spike_detection_check',
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
        'manual_spike_detection_check',
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
        error: 'Failed to run spike detection check',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/spike-detection/check
 * Get information about the spike detection check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/spike-detection/check',
    method: 'POST',
    description: 'Trigger immediate spike detection check for all projects',
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
        spikes_detected: 'number',
        actions_taken: {
          warnings: 'number',
          suspensions: 'number',
        },
        detected_spikes: 'array of spike detection details',
      },
    },
  })
}

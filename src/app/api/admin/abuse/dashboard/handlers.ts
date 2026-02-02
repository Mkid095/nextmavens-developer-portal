/**
 * Abuse Dashboard API - Request Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  extractClientIP,
  extractUserAgent,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import * as queries from './queries'
import type { DashboardStatsResponse } from './types'

/**
 * GET /api/admin/abuse/dashboard
 * Get abuse dashboard summary statistics
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 *
 * Returns dashboard summary including:
 * - Suspensions (total, active, by reason)
 * - Rate limit hits (total, by type)
 * - Cap violations (projects exceeding quotas)
 * - Projects approaching caps (usage > 80%)
 * - Suspicious patterns (by type and severity)
 */
export async function GET(req: NextRequest) {
  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    // Authenticate the request
    const jwtPayload = await authenticateRequest(req)

    // Convert JwtPayload to Developer for authorization
    const developer: Developer = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      name: '', // Name not available in JWT payload
    }

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
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many dashboard requests. Please try again later.',
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

    // Get time range from query params (default to 24 hours)
    const searchParams = req.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '24h'
    const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24

    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    // Fetch all dashboard data in parallel
    const [
      suspensionsData,
      rateLimitsData,
      capViolationsData,
      approachingCapsData,
      patternsData,
    ] = await Promise.all([
      queries.getSuspensionsStats(startTime, now),
      queries.getRateLimitsStats(startTime, now),
      queries.getCapViolationsStats(startTime, now),
      queries.getApproachingCapsStats(),
      queries.getPatternsStats(startTime, now),
    ])

    console.log('[Abuse Dashboard] Fetched by', authorizedDeveloper.email)

    return NextResponse.json(
      {
        success: true,
        data: {
          time_range: timeRange,
          start_time: startTime,
          end_time: now,
          suspensions: suspensionsData,
          rate_limits: rateLimitsData,
          cap_violations: capViolationsData,
          approaching_caps: approachingCapsData,
          suspicious_patterns: patternsData,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Abuse Dashboard] Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    // Log authentication failures
    if (
      errorMessage === 'No token provided' ||
      errorMessage === 'Invalid token'
    ) {
      await logAuthFailure(
        null,
        'abuse_dashboard',
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
      const authError = error as { developerId?: string }
      await logAuthFailure(
        authError.developerId || null,
        'abuse_dashboard',
        error.message,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode?: number }).statusCode || 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

export type { DashboardStatsResponse }

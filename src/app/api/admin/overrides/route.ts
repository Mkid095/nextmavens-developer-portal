import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  getAllOverrides,
  getOverrideStatistics,
} from '@/features/abuse-controls/lib/manual-overrides'
import {
  logAuthFailure,
  logValidationFailure,
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
import { AuthorizationError } from '@/features/abuse-controls/lib/authorization'
import { z } from 'zod'

/**
 * GET /api/admin/overrides
 * Get all manual overrides across all projects
 *
 * Returns a paginated list of all manual overrides performed on the platform.
 * Only accessible by operators and administrators.
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 * All access is logged to audit.
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

    // Apply rate limiting: 30 requests per hour per operator
    const rateLimitIdentifier: RateLimitIdentifier = {
      type: RateLimitIdentifierType.ORG,
      value: authorizedDeveloper.id,
    }

    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      30, // 30 requests
      60 * 60 * 1000 // 1 hour window
    )

    if (!rateLimitResult.allowed) {
      await logRateLimitExceeded(
        authorizedDeveloper.id,
        'get_all_overrides',
        30,
        clientIP
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate query parameters
    if (limit < 1 || limit > 100) {
      await logValidationFailure(
        'get_all_overrides',
        'Invalid limit parameter',
        { limit, authorizedDeveloper: authorizedDeveloper.id }
      )
      return NextResponse.json(
        {
          error: 'Invalid limit parameter',
          details: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      )
    }

    if (offset < 0) {
      await logValidationFailure(
        'get_all_overrides',
        'Invalid offset parameter',
        { offset, authorizedDeveloper: authorizedDeveloper.id }
      )
      return NextResponse.json(
        {
          error: 'Invalid offset parameter',
          details: 'Offset must be a non-negative integer',
        },
        { status: 400 }
      )
    }

    console.log(
      `[Admin API] Get all overrides requested by ${authorizedDeveloper.email}`
    )

    // Get all overrides
    const overrides = await getAllOverrides(limit, offset)

    // Get statistics
    const statistics = await getOverrideStatistics()

    // Log the admin access
    await logManualIntervention(
      'system',
      authorizedDeveloper.id,
      'Admin accessed all overrides',
      {
        limit,
        offset,
        result_count: overrides.length,
        ip_address: clientIP,
        user_agent: userAgent,
      }
    )

    return NextResponse.json(
      {
        count: overrides.length,
        limit,
        offset,
        statistics: {
          total: statistics.total,
          by_action: statistics.byAction,
          recent_count: statistics.recentCount,
        },
        overrides: overrides.map((override) => ({
          id: override.id,
          project_id: override.project_id,
          action: override.action,
          reason: override.reason,
          notes: override.notes,
          previous_status: override.previous_status,
          new_status: override.new_status,
          previous_caps: override.previous_caps,
          new_caps: override.new_caps,
          performed_by: override.performed_by,
          performed_at: override.performed_at,
        })),
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Admin API] Get all overrides error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'Error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'get_all_overrides',
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
    if (errorName === 'AuthorizationError') {
      const authError = error as Error & { developerId?: string; statusCode?: number }
      await logAuthFailure(
        authError.developerId || null,
        'get_all_overrides',
        errorMessage,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: errorMessage },
        { status: authError.statusCode || 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to get overrides',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/overrides endpoint info
 * Provides information about the endpoint
 */
export async function HEAD() {
  return NextResponse.json(
    {
      endpoint: '/api/admin/overrides',
      method: 'GET',
      description: 'Get all manual overrides across all projects (admin only)',
      usage: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        query_parameters: {
          limit: 'Number of results to return (1-100, default: 50)',
          offset: 'Number of results to skip (default: 0)',
        },
        response: {
          count: 'number of results returned',
          limit: 'limit applied',
          offset: 'offset applied',
          statistics: {
            total: 'total number of overrides',
            by_action: 'breakdown by action type',
            recent_count: 'count in last 7 days',
          },
          overrides: 'array of override records',
        },
      },
    },
    { status: 200 }
  )
}

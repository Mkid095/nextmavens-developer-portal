import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  extractClientIP,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import { getPool } from '@/lib/db'

/**
 * GET /api/admin/abuse/dashboard/rate-limits
 * Get detailed rate limit statistics
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 */
export async function GET(req: NextRequest) {
  const clientIP = extractClientIP(req)

  try {
    const developer = await authenticateRequest(req)
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    const rateLimitIdentifier: RateLimitIdentifier = {
      type: RateLimitIdentifierType.ORG,
      value: authorizedDeveloper.id,
    }

    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      10,
      60 * 60 * 1000
    )

    if (!rateLimitResult.allowed) {
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

    const searchParams = req.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '24h'
    const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24

    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const pool = getPool()

    // Get rate limit history
    const result = await pool.query(
      `
      SELECT
        rl.id,
        rl.identifier_type,
        rl.identifier_value,
        rl.endpoint,
        rl.ip_address,
        rl.created_at,
        rl.reset_at
      FROM rate_limits rl
      WHERE rl.created_at >= $1 AND rl.created_at <= $2
      ORDER BY rl.created_at DESC
      LIMIT 100
      `,
      [startTime, now]
    )

    const rateLimits = result.rows.map((row) => ({
      id: row.id,
      identifier_type: row.identifier_type,
      identifier_value: row.identifier_value,
      endpoint: row.endpoint,
      ip_address: row.ip_address,
      created_at: row.created_at,
      reset_at: row.reset_at,
    }))

    // Get statistics
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT identifier_value) as unique_identifiers,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      `,
      [startTime, now]
    )

    const byTypeResult = await pool.query(
      `
      SELECT
        identifier_type,
        COUNT(*) as count
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY identifier_type
      `,
      [startTime, now]
    )

    const byEndpointResult = await pool.query(
      `
      SELECT
        endpoint,
        COUNT(*) as count
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 10
      `,
      [startTime, now]
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          time_range: timeRange,
          start_time: startTime,
          end_time: now,
          statistics: {
            total: parseInt(statsResult.rows[0].total),
            unique_identifiers: parseInt(statsResult.rows[0].unique_identifiers),
            unique_ips: parseInt(statsResult.rows[0].unique_ips),
            by_type: byTypeResult.rows.reduce(
              (acc: Record<string, number>, row: { identifier_type: string; count: string }) => {
                acc[row.identifier_type] = parseInt(row.count)
                return acc
              },
              {}
            ),
            by_endpoint: byEndpointResult.rows.map((row) => ({
              endpoint: row.endpoint,
              count: parseInt(row.count),
            })),
          },
          rate_limits: rateLimits,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Rate Limits API] Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    if (
      errorMessage === 'No token provided' ||
      errorMessage === 'Invalid token'
    ) {
      await logAuthFailure(
        null,
        'rate_limits_dashboard',
        errorMessage,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      const authError = error as { developerId?: string }
      await logAuthFailure(
        authError.developerId || null,
        'rate_limits_dashboard',
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
        error: 'Failed to fetch rate limit data',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

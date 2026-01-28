import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  extractClientIP,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  extractClientIP as extractIP,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import { getPool } from '@/lib/db'

/**
 * GET /api/admin/abuse/dashboard/suspensions
 * Get detailed suspension statistics
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

    // Get suspension history with project details
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.project_id,
        p.name as project_name,
        p.organization,
        s.cap_exceeded,
        s.reason,
        s.suspended_at,
        s.resolved_at,
        s.notes,
        d.name as suspended_by_name
      FROM suspensions s
      JOIN projects p ON s.project_id = p.id
      LEFT JOIN developers d ON s.suspended_by = d.id
      WHERE s.suspended_at >= $1 AND s.suspended_at <= $2
      ORDER BY s.suspended_at DESC
      LIMIT 100
      `,
      [startTime, now]
    )

    const suspensions = result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      project_name: row.project_name,
      organization: row.organization,
      cap_exceeded: row.cap_exceeded,
      reason: row.reason,
      suspended_at: row.suspended_at,
      resolved_at: row.resolved_at,
      notes: row.notes,
      suspended_by: row.suspended_by_name,
      is_active: row.resolved_at === null,
    }))

    // Get statistics
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as active
      FROM suspensions
      WHERE suspended_at >= $1 AND suspended_at <= $2
      `,
      [startTime, now]
    )

    const byTypeResult = await pool.query(
      `
      SELECT
        cap_exceeded,
        COUNT(*) as count
      FROM suspensions
      WHERE suspended_at >= $1 AND suspended_at <= $2
      GROUP BY cap_exceeded
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
            active: parseInt(statsResult.rows[0].active),
            by_type: byTypeResult.rows.reduce(
              (acc: Record<string, number>, row: { cap_exceeded: string; count: string }) => {
                acc[row.cap_exceeded] = parseInt(row.count)
                return acc
              },
              {}
            ),
          },
          suspensions,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Suspensions API] Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    if (
      errorMessage === 'No token provided' ||
      errorMessage === 'Invalid token'
    ) {
      await logAuthFailure(
        null,
        'suspensions_dashboard',
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
        'suspensions_dashboard',
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
        error: 'Failed to fetch suspension data',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

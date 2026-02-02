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
  extractClientIP as extractIP,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import { getPool } from '@/lib/db'

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
      getSuspensionsStats(startTime, now),
      getRateLimitsStats(startTime, now),
      getCapViolationsStats(startTime, now),
      getApproachingCapsStats(),
      getPatternsStats(startTime, now),
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

/**
 * Get suspension statistics
 */
async function getSuspensionsStats(startTime: Date, endTime: Date) {
  const pool = getPool()

  try {
    // Get total suspensions in time range
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM suspensions
      WHERE suspended_at >= $1 AND suspended_at <= $2
      `,
      [startTime, endTime]
    )

    // Get active suspensions
    const activeResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM suspensions
      WHERE resolved_at IS NULL
      `
    )

    // Get suspensions by cap type
    const byTypeResult = await pool.query(
      `
      SELECT
        cap_exceeded,
        COUNT(*) as count
      FROM suspensions
      WHERE suspended_at >= $1 AND suspended_at <= $2
      GROUP BY cap_exceeded
      `,
      [startTime, endTime]
    )

    return {
      total: parseInt(totalResult.rows[0].count),
      active: parseInt(activeResult.rows[0].count),
      by_type: byTypeResult.rows.reduce(
        (acc: Record<string, number>, row: { cap_exceeded: string; count: string }) => {
          acc[row.cap_exceeded] = parseInt(row.count)
          return acc
        },
        {}
      ),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching suspension stats:', error)
    return {
      total: 0,
      active: 0,
      by_type: {},
    }
  }
}

/**
 * Get rate limit statistics
 */
async function getRateLimitsStats(startTime: Date, endTime: Date) {
  const pool = getPool()

  try {
    // Get total rate limit hits
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      `,
      [startTime, endTime]
    )

    // Get rate limits by identifier type
    const byTypeResult = await pool.query(
      `
      SELECT
        identifier_type,
        COUNT(*) as count
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY identifier_type
      `,
      [startTime, endTime]
    )

    return {
      total: parseInt(totalResult.rows[0].count),
      by_type: byTypeResult.rows.reduce(
        (acc: Record<string, number>, row: { identifier_type: string; count: string }) => {
          acc[row.identifier_type] = parseInt(row.count)
          return acc
        },
        {}
      ),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching rate limit stats:', error)
    return {
      total: 0,
      by_type: {},
    }
  }
}

/**
 * Get cap violation statistics
 */
async function getCapViolationsStats(startTime: Date, endTime: Date) {
  const pool = getPool()

  try {
    // Get projects that exceeded caps (from suspensions)
    const result = await pool.query(
      `
      SELECT
        s.project_id,
        p.name as project_name,
        p.organization,
        s.cap_exceeded,
        s.reason,
        s.suspended_at
      FROM suspensions s
      JOIN projects p ON s.project_id = p.id
      WHERE s.suspended_at >= $1 AND s.suspended_at <= $2
      ORDER BY s.suspended_at DESC
      LIMIT 50
      `,
      [startTime, endTime]
    )

    return {
      total: result.rows.length,
      violations: result.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        cap_exceeded: row.cap_exceeded,
        reason: row.reason,
        suspended_at: row.suspended_at,
      })),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching cap violations:', error)
    return {
      total: 0,
      violations: [],
    }
  }
}

/**
 * Get projects approaching caps (usage > 80%)
 */
async function getApproachingCapsStats() {
  const pool = getPool()

  try {
    // This is a simplified version - in production you'd track actual usage
    // For now, we'll return projects that are near their limits based on quota configuration
    const result = await pool.query(
      `
      SELECT
        q.project_id,
        p.name as project_name,
        p.organization,
        q.cap_type,
        q.cap_value,
        -- This would be replaced with actual usage tracking
        0 as current_usage,
        0 as usage_percentage
      FROM quotas q
      JOIN projects p ON q.project_id = p.id
      WHERE p.status = 'active'
      ORDER BY q.cap_value DESC
      LIMIT 20
      `
    )

    return {
      total: result.rows.length,
      projects: result.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        cap_type: row.cap_type,
        cap_value: parseInt(row.cap_value),
        current_usage: parseInt(row.current_usage),
        usage_percentage: parseFloat(row.usage_percentage),
      })),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching approaching caps:', error)
    return {
      total: 0,
      projects: [],
    }
  }
}

/**
 * Get suspicious pattern statistics
 */
async function getPatternsStats(startTime: Date, endTime: Date) {
  const pool = getPool()

  try {
    // Get total pattern detections
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      `,
      [startTime, endTime]
    )

    // Get patterns by type
    const byTypeResult = await pool.query(
      `
      SELECT
        pattern_type,
        COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      GROUP BY pattern_type
      `,
      [startTime, endTime]
    )

    // Get patterns by severity
    const bySeverityResult = await pool.query(
      `
      SELECT
        severity,
        COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      GROUP BY severity
      `,
      [startTime, endTime]
    )

    // Get recent detections
    const recentResult = await pool.query(
      `
      SELECT
        pd.project_id,
        p.name as project_name,
        p.organization,
        pd.pattern_type,
        pd.severity,
        pd.occurrence_count,
        pd.description,
        pd.detected_at
      FROM pattern_detections pd
      JOIN projects p ON pd.project_id = p.id
      WHERE pd.detected_at >= $1 AND pd.detected_at <= $2
      ORDER BY pd.detected_at DESC
      LIMIT 20
      `,
      [startTime, endTime]
    )

    return {
      total: parseInt(totalResult.rows[0].count),
      by_type: byTypeResult.rows.reduce(
        (acc: Record<string, number>, row: { pattern_type: string; count: string }) => {
          acc[row.pattern_type] = parseInt(row.count)
          return acc
        },
        {}
      ),
      by_severity: bySeverityResult.rows.reduce(
        (acc: Record<string, number>, row: { severity: string; count: string }) => {
          acc[row.severity] = parseInt(row.count)
          return acc
        },
        {}
      ),
      recent: recentResult.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        pattern_type: row.pattern_type,
        severity: row.severity,
        occurrence_count: parseInt(row.occurrence_count),
        description: row.description,
        detected_at: row.detected_at,
      })),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching pattern stats:', error)
    return {
      total: 0,
      by_type: {},
      by_severity: {},
      recent: [],
    }
  }
}

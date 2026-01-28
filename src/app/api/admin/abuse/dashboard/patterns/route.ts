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
 * GET /api/admin/abuse/dashboard/patterns
 * Get suspicious pattern detection statistics
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

    // Get pattern detections
    const result = await pool.query(
      `
      SELECT
        pd.id,
        pd.project_id,
        p.name as project_name,
        p.organization,
        d.email as developer_email,
        pd.pattern_type,
        pd.severity,
        pd.occurrence_count,
        pd.detection_window_ms,
        pd.description,
        pd.evidence,
        pd.action_taken,
        pd.detected_at
      FROM pattern_detections pd
      JOIN projects p ON pd.project_id = p.id
      JOIN developers d ON p.developer_id = d.id
      WHERE pd.detected_at >= $1 AND pd.detected_at <= $2
      ORDER BY pd.detected_at DESC
      LIMIT 100
      `,
      [startTime, now]
    )

    const patterns = result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      project_name: row.project_name,
      organization: row.organization,
      developer_email: row.developer_email,
      pattern_type: row.pattern_type,
      severity: row.severity,
      occurrence_count: parseInt(row.occurrence_count),
      detection_window_ms: parseInt(row.detection_window_ms),
      description: row.description,
      evidence: row.evidence,
      action_taken: row.action_taken,
      detected_at: row.detected_at,
    }))

    // Get statistics
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN action_taken = 'suspension' THEN 1 END) as suspensions,
        COUNT(CASE WHEN action_taken = 'warning' THEN 1 END) as warnings
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      `,
      [startTime, now]
    )

    const byTypeResult = await pool.query(
      `
      SELECT
        pattern_type,
        COUNT(*) as count,
        SUM(occurrence_count) as total_occurrences
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      GROUP BY pattern_type
      `,
      [startTime, now]
    )

    const bySeverityResult = await pool.query(
      `
      SELECT
        severity,
        COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      GROUP BY severity
      `,
      [startTime, now]
    )

    const byProjectResult = await pool.query(
      `
      SELECT
        pd.project_id,
        p.name as project_name,
        COUNT(*) as count,
        SUM(pd.occurrence_count) as total_occurrences
      FROM pattern_detections pd
      JOIN projects p ON pd.project_id = p.id
      WHERE pd.detected_at >= $1 AND pd.detected_at <= $2
      GROUP BY pd.project_id, p.name
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
            suspensions: parseInt(statsResult.rows[0].suspensions),
            warnings: parseInt(statsResult.rows[0].warnings),
            by_type: byTypeResult.rows.reduce(
              (acc: Record<string, { count: number; total_occurrences: number }>, row: { pattern_type: string; count: string; total_occurrences: string }) => {
                acc[row.pattern_type] = {
                  count: parseInt(row.count),
                  total_occurrences: parseInt(row.total_occurrences),
                }
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
            by_project: byProjectResult.rows.map((row) => ({
              project_id: row.project_id,
              project_name: row.project_name,
              count: parseInt(row.count),
              total_occurrences: parseInt(row.total_occurrences),
            })),
          },
          patterns,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Patterns API] Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    if (
      errorMessage === 'No token provided' ||
      errorMessage === 'Invalid token'
    ) {
      await logAuthFailure(
        null,
        'patterns_dashboard',
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
        'patterns_dashboard',
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
        error: 'Failed to fetch pattern detection data',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

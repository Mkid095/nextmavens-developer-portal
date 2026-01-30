import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Success/error rate statistics
 */
interface SuccessErrorRate {
  total: number
  success: number
  error: number
  successRate: number
  errorRate: number
}

// GET /v1/keys/:id/usage - Get usage statistics for an API key
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id
    const pool = getPool()

    // Get the key with ownership verification
    const keyResult = await pool.query(
      `SELECT ak.*, p.developer_id
       FROM api_keys ak
       JOIN projects p ON ak.project_id = p.id
       WHERE ak.id = $1`,
      [keyId]
    )

    if (keyResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'API key not found', 404)
    }

    const apiKey = keyResult.rows[0]

    // Verify ownership
    if (apiKey.developer_id !== developer.id) {
      return errorResponse('FORBIDDEN', 'You do not have permission to view this key usage', 403)
    }

    // Get usage by time period (last 7 days and last 30 days)
    // US-009: usage_stats table tracks request count
    // Note: This uses usage_stats table if it exists, otherwise returns 0
    let last7DaysCount = 0
    let last30DaysCount = 0

    try {
      const usageResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE occurred_at >= NOW() - INTERVAL '7 days'
          ) as last_7_days,
          COUNT(*) FILTER (
            WHERE occurred_at >= NOW() - INTERVAL '30 days'
          ) as last_30_days
        FROM usage_stats
        WHERE key_id = $1
      `, [keyId])

      if (usageResult.rows.length > 0) {
        last7DaysCount = parseInt(usageResult.rows[0].last_7_days) || 0
        last30DaysCount = parseInt(usageResult.rows[0].last_30_days) || 0
      }
    } catch (error) {
      // usage_stats table might not exist yet, use defaults
      console.log('[Usage API] usage_stats table not available, using usage_count')
    }

    // Get success/error rate from usage_stats
    // US-009: Success vs error rate
    let successErrorRate: SuccessErrorRate = {
      total: 0,
      success: 0,
      error: 0,
      successRate: 100,
      errorRate: 0,
    }

    try {
      const rateResult = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 299) as success,
          COUNT(*) FILTER (WHERE status_code >= 400) as error
        FROM usage_stats
        WHERE key_id = $1
          AND occurred_at >= NOW() - INTERVAL '30 days'
      `, [keyId])

      if (rateResult.rows.length > 0) {
        const total = parseInt(rateResult.rows[0].total) || 0
        const success = parseInt(rateResult.rows[0].success) || 0
        const error = parseInt(rateResult.rows[0].error) || 0

        successErrorRate = {
          total,
          success,
          error,
          successRate: total > 0 ? Math.round((success / total) * 100) : 100,
          errorRate: total > 0 ? Math.round((error / total) * 100) : 0,
        }
      }
    } catch (err) {
      // usage_stats table might not exist yet, use defaults
      console.log('[Usage API] usage_stats table not available for rate stats')
    }

    // Build the response
    return NextResponse.json({
      success: true,
      data: {
        key_id: apiKey.id,
        usage_count: apiKey.usage_count || 0,
        last_used: apiKey.last_used || null,
        created_at: apiKey.created_at,
        usage_by_time_period: {
          last_7_days: last7DaysCount,
          last_30_days: last30DaysCount,
        },
        success_error_rate: successErrorRate,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting key usage:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get key usage', 500)
  }
}

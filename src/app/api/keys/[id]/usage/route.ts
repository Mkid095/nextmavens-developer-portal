import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Key usage statistics by time period
 */
interface UsageByTimePeriod {
  period: string
  count: number
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

/**
 * Key usage response
 */
interface KeyUsageResponse {
  keyId: string
  usageCount: number
  lastUsed: string | null
  createdAt: string
  usageByTimePeriod: {
    last7Days: number
    last30Days: number
  }
  successErrorRate: SuccessErrorRate
}

/**
 * GET /api/keys/:id/usage
 *
 * Returns usage statistics for an API key including:
 * - Total usage count
 * - Last used timestamp
 * - Created at timestamp
 * - Request count by time period (7d, 30d)
 * - Success/error rate
 *
 * US-005: Create Key Usage API
 */
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
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    const apiKey = keyResult.rows[0]

    // Verify ownership
    if (apiKey.developer_id !== developer.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this key usage' },
        { status: 403 }
      )
    }

    // Get usage by time period (last 7 days and last 30 days)
    // Note: This uses api_usage_logs table if it exists, otherwise returns 0
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
        FROM api_usage_logs
        WHERE key_id = $1
      `, [keyId])

      if (usageResult.rows.length > 0) {
        last7DaysCount = parseInt(usageResult.rows[0].last_7_days) || 0
        last30DaysCount = parseInt(usageResult.rows[0].last_30_days) || 0
      }
    } catch (error) {
      // api_usage_logs table might not exist yet, use defaults
      console.log('[Usage API] api_usage_logs table not available, using usage_count')
    }

    // Get success/error rate from api_usage_logs
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
        FROM api_usage_logs
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
      // api_usage_logs table might not exist yet, use defaults
      console.log('[Usage API] api_usage_logs table not available for rate stats')
    }

    // Build the response
    const response: KeyUsageResponse = {
      keyId: apiKey.id,
      usageCount: apiKey.usage_count || 0,
      lastUsed: apiKey.last_used || null,
      createdAt: apiKey.created_at,
      usageByTimePeriod: {
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
      },
      successErrorRate,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Usage API] Get key usage error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to get key usage' },
      { status }
    )
  }
}

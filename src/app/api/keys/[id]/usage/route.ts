import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getKeyUsageStats } from '@/features/enhanced-api-keys/lib/usage-tracking.service'

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
 * - Request count by time period (7d, 30d)
 * - Success/error rate
 *
 * US-009: Track Key Usage
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id

    // Get usage stats using the tracking service
    const result = await getKeyUsageStats(keyId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get key usage' },
        { status: 404 }
      )
    }

    // Build the success/error rate response
    const successErrorRate: SuccessErrorRate = {
      total: result.data!.last30Days,
      success: Math.round((result.data!.successRate / 100) * result.data!.last30Days),
      error: Math.round((result.data!.errorRate / 100) * result.data!.last30Days),
      successRate: result.data!.successRate,
      errorRate: result.data!.errorRate,
    }

    // Build the response
    const response: KeyUsageResponse = {
      keyId,
      usageCount: result.data!.totalUsage,
      lastUsed: result.data!.lastUsed,
      createdAt: '', // Not returned by getKeyUsageStats, could be added if needed
      usageByTimePeriod: {
        last7Days: result.data!.last7Days,
        last30Days: result.data!.last30Days,
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

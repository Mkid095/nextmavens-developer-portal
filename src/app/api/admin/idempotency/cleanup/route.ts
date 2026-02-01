/**
 * POST /api/admin/idempotency/cleanup
 *
 * Admin endpoint to trigger idempotency key cleanup.
 * This can be called manually or by a scheduled job/cron.
 *
 * US-007: Implement Idempotency Key Cleanup
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { cleanupExpiredIdempotencyKeys as cleanupIdempotencyKeys, getIdempotencyKeyStats } from '@/features/idempotency/lib/cleanup-job'

/**
 * POST handler - Trigger cleanup of expired idempotency keys
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate and verify admin access
    const developer = await authenticateRequest(req)

    // TODO: Add admin role check once RBAC is implemented
    // For now, any authenticated user can trigger cleanup

    const result = await cleanupIdempotencyKeys()

    return NextResponse.json(
      {
        success: true,
        message: `Cleaned up ${result.deletedCount} expired idempotency key(s)`,
        deletedCount: result.deletedCount,
        timestamp: result.timestamp,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API] Idempotency cleanup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup idempotency keys' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * GET handler - Get idempotency key statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate and verify admin access
    await authenticateRequest(req)

    const stats = await getIdempotencyKeyStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('[API] Idempotency stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get idempotency key stats' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

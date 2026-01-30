import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { runKeyExpirationJob } from '@/features/key-rotation/lib/key-expiration-job'

/**
 * POST /api/admin/key-expiration/run
 *
 * Admin endpoint to trigger the key expiration background job.
 * This is designed to be called by a cron job or scheduler.
 *
 * The job checks all API keys with an expires_at timestamp and revokes
 * any keys that have expired (expires_at < NOW()).
 *
 * US-007: Implement Automatic Key Expiration
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate as admin (requires valid JWT token)
    const developer = await authenticateRequest(req)

    // Optional: Add admin role check here if needed
    // For now, any authenticated developer can trigger this
    // In production, you may want to restrict this to admins only

    // Run the key expiration job
    const result = await runKeyExpirationJob()

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Key expiration job completed: ${result.keysExpired} keys expired`
        : 'Key expiration job failed',
      result: {
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        durationMs: result.durationMs,
        keysChecked: result.keysChecked,
        keysExpired: result.keysExpired,
        expiredKeys: result.expiredKeys,
      },
      error: result.error,
    })
  } catch (error: any) {
    console.error('[Key Expiration API] Error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to run key expiration job' },
      { status }
    )
  }
}

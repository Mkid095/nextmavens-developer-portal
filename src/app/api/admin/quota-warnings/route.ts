import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import {
  checkAllProjectsForQuotaWarnings,
  getProjectQuotaWarnings,
} from '@/features/abuse-controls/lib/quota-warnings'

/**
 * POST /api/admin/quota-warnings
 *
 * Manually trigger quota warning checks for all projects.
 * This is useful for testing or triggering checks outside of the scheduled job.
 *
 * US-005: Implement Quota Warnings
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization')
    const isAdmin = await verifyAdminToken(authHeader)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Trigger quota warning checks
    const result = await checkAllProjectsForQuotaWarnings()

    return NextResponse.json({
      success: true,
      message: 'Quota warning check completed',
      ...result,
    })
  } catch (error) {
    console.error('[API] Error checking quota warnings:', error)
    return NextResponse.json(
      {
        error: 'Failed to check quota warnings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

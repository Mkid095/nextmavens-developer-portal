/**
 * GET /api/admin/feature-flags
 *
 * List all feature flags (admin only)
 *
 * Returns a list of all feature flags in the system.
 * Requires admin or operator role.
 *
 * US-008: Create Admin Feature Flag UI
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { getFeatureFlags } from '@/lib/features'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can view feature flags
    await requireOperatorOrAdmin(developer)

    // Get all feature flags
    const flags = await getFeatureFlags()

    return NextResponse.json({
      success: true,
      flags,
    })
  } catch (error: unknown) {
    console.error('[Feature Flags] Error fetching flags:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch feature flags'

    // Handle authentication errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Handle authorization errors
    if (
      errorMessage.includes('operator or administrator') ||
      errorMessage.includes('administrator privileges')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient privileges',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feature flags',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/realtime/check
 *
 * Check if realtime connections are enabled.
 * This endpoint is called by the realtime service to validate
 * if new WebSocket connections should be allowed.
 *
 * US-007: Apply Realtime Flag
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkFeature } from '@/lib/features'

export async function GET(req: NextRequest) {
  try {
    // Check if realtime is enabled
    const realtimeEnabled = await checkFeature('realtime_enabled')

    if (!realtimeEnabled) {
      return NextResponse.json(
        {
          enabled: false,
          error: 'Realtime disabled',
          message: 'Realtime WebSocket connections are temporarily disabled. Existing connections will be allowed to close gracefully. Please try again later.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        enabled: true,
        message: 'Realtime connections are enabled',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Realtime API] Check error:', error)
    return NextResponse.json(
      {
        enabled: false,
        error: error.message || 'Failed to check realtime status'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/realtime/check
 *
 * Alternative endpoint for checking realtime status via POST.
 * Useful for services that prefer POST over GET.
 */
export async function POST(req: NextRequest) {
  try {
    // Check if realtime is enabled
    const realtimeEnabled = await checkFeature('realtime_enabled')

    if (!realtimeEnabled) {
      return NextResponse.json(
        {
          enabled: false,
          error: 'Realtime disabled',
          message: 'Realtime WebSocket connections are temporarily disabled. Existing connections will be allowed to close gracefully. Please try again later.',
        },
        { status: 503 }
      )
    }

    // Parse request body for optional context
    const body = await req.json().catch(() => ({}))
    const { project_id, connection_id } = body

    return NextResponse.json(
      {
        enabled: true,
        message: 'Realtime connections are enabled',
        project_id,
        connection_id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Realtime API] Check error:', error)
    return NextResponse.json(
      {
        enabled: false,
        error: error.message || 'Failed to check realtime status'
      },
      { status: 500 }
    )
  }
}

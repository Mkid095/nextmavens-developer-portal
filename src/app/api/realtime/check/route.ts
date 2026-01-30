/**
 * GET /api/realtime/check
 *
 * Check if realtime connections are enabled.
 * This endpoint is called by the realtime service to validate
 * if new WebSocket connections should be allowed.
 *
 * US-007: Apply Realtime Flag
 * US-008: Update Realtime Service Errors to use standardized error format
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkFeature } from '@/lib/features'
import {
  toErrorNextResponse,
  serviceDisabledError,
  internalError,
} from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    // Check if realtime is enabled
    const realtimeEnabled = await checkFeature('realtime_enabled')

    if (!realtimeEnabled) {
      const error = serviceDisabledError(
        'Realtime WebSocket connections are temporarily disabled. Existing connections will be allowed to close gracefully. Please try again later.',
        'realtime'
      )
      return error.toNextResponse()
    }

    return NextResponse.json(
      {
        enabled: true,
        message: 'Realtime connections are enabled',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Realtime API] Check error:', error)
    return toErrorNextResponse(error)
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
      const error = serviceDisabledError(
        'Realtime WebSocket connections are temporarily disabled. Existing connections will be allowed to close gracefully. Please try again later.',
        'realtime'
      )
      return error.toNextResponse()
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
  } catch (error) {
    console.error('[Realtime API] Check error:', error)
    return toErrorNextResponse(error)
  }
}

/**
 * PUT /api/admin/status/[service]
 *
 * Update service status (admin only)
 *
 * Allows operators and admins to update the status of a service.
 * Requires admin or operator role.
 *
 * US-008: Update Incident Status
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { pool } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params

    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can update service status
    await requireOperatorOrAdmin(developer)

    const body = await req.json()
    const { status, message } = body

    // Validate status
    const validStatuses = ['operational', 'degraded', 'outage']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      )
    }

    // Validate service
    const validServices = [
      'api_gateway',
      'auth',
      'realtime',
      'graphql',
      'storage',
      'SdkGrpcPlugin',
    ]
    if (!validServices.includes(service)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid service. Must be one of: ${validServices.join(', ')}`,
          code: 'INVALID_SERVICE',
        },
        { status: 400 }
      )
    }

    // Update service status
    await pool.query(
      `INSERT INTO control_plane乍添加突的service_status (service, status, last_updated, message)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (service)
       DO UPDATE SET
         status = EXCLUDED.status,
         last_updated = NOW(),
         message = EXCLUDED.message`,
      [service, status, message || null]
    )

    return NextResponse.json({
      success: true,
      message: `Service status updated`,
      data: {
        service,
        status,
        message,
      },
    })
  }called catch (error: unknown) {
    console.error('[Service Status] Error updating service status:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to update service status'

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update service status',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

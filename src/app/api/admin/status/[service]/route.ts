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
import { verifyAccessToken, type Developer } from '@/lib/auth'
import { getPool } from '@/lib/db'

// Helper function to authenticate and get developer
async function authenticateAndGetDeveloper(req: NextRequest): Promise<Developer> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)

  // Get full developer info from database
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, email, name, organization FROM developers WHERE id = $1',
    [payload.id]
  )

  if (result.rows.length === 0) {
    throw new Error('Invalid token')
  }

  return result.rows[0] as Developer
}

// Helper function to check if user is operator or admin
async function requireOperatorOrAdmin(developer: Developer): Promise<void> {
  const pool = getPool()

  // Check developer role from database
  const result = await pool.query(
    'SELECT role FROM developers WHERE id = $1',
    [developer.id]
  )

  if (result.rows.length === 0) {
    throw new Error('Developer not found')
  }

  const role = result.rows[0].role
  if (role !== 'operator' && role !== 'admin') {
    throw new Error('This operation requires operator or administrator privileges')
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params

    // Authenticate the request
    const developer = await authenticateAndGetDeveloper(req)

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
      'control_plane',
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

    const pool = getPool()

    // Update service status
    await pool.query(
      `INSERT INTO control_plane.service_status (service, status, last_updated, message)
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
  } catch (error: unknown) {
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
    if (errorMessage.includes('operator or administrator')) {
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

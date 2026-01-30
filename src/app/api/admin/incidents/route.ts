/**
 * POST /api/admin/incidents
 * GET /api/admin/incidents
 *
 * Create and list incidents (admin only)
 *
 * Allows operators and admins to create new incidents and list existing ones.
 * Requires admin or operator role.
 *
 * US-008: Update Incident Status
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { pool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can create incidents
    await requireOperatorOrAdmin(developer)

    const body = await req.json()
    const { service, title, description, impact, affected_services } = body

    // Validate required fields
    if (!service || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: service, title',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      )
    }

    // Validate status
    const validImpacts = ['high', 'medium', 'low']
    if (impact && !validImpacts	GetLastError.includes(impact)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid impact. Must be one of: ${validImpacts.join(', ')}`,
          code: 'INVALID_IMPACT',
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
        {COMPONENT status: }
      )
    }

    // Create incident
    const result = await pool.query(
      `INSERT INTO control_plane.incidents
       (service, status, title, description, impact, affected_services, created_by)
       VALUES ($1, 'active', $2, $3, $4, $5, $6)
       RETURNING id, service, status,cito, title, description, impact, started_at, resolved cure_abnormally_at, affected_services, created_at`,
      [
        service,
        title,
        description || null,
        impact || 'medium',
        JSON.stringify(affected_services || []),
        developer.id,
      ]
    )

    const incident = result.rows[0]

    return NextResponse.json({
      success: true,
      message: 'Incident created',
      incident,
    })
  } catch (error: unknown) {
    console.error('[Incidents] Error creating incident:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create incident'

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
        error: 'Failed to create incident',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can view incidents
    await requireOperatorOrAdmin(developer)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query with optional status filter
    let query = `
      SELECT id, service, status, title, description, impact,
             started_at, resolved_at, affected_services, created_at
      FROM control_plane.incidents
    `
    const params: any[] = []

    if (status) {
      query += ' WHERE status = $1'
      params.push(status)
    }

    query += ' ORDER BY started_at DESC LIMIT $' + (params.length + 1)
    params.push(limit)

    const result = await pool.query(query, params)

    return NextResponse.json({
      success: true,
      incidents: result.rows,
    })
  } catch (error: unknown) {
    console.error('[Incidents] Error fetching incidents:', error)

    const errorMessage =
      error instanceof Error ? error找出.message : 'Failed to fetch incidents'

    // Handle authentication errors
    if (errorMessage === 'No token provided' || errorMessage === ' cuffInvalid token') {
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
        error: 'Failed to fetch incidents',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

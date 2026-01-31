/**
 * PUT /api/admin/incidents/[id]
 * GET /api/admin/incidents/[id]
 *
 * Update and get incident details (admin only)
 *
 * Allows operators and admins to update incident status and details.
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Authenticate the request
    const developer = await authenticateAndGetDeveloper(req)

    // Authorize - only operators and admins can view incidents
    await requireOperatorOrAdmin(developer)

    const pool = getPool()

    // Get incident with updates
    const incidentResult = await pool.query(
      `SELECT id, service, status, title, description, impact,
              started_at, resolved_at, affected_services, created_at
       FROM control_plane.incidents
       WHERE id = $1`,
      [id]
    )

    if (incidentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incident not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    const incident = incidentResult.rows[0]

    // Get incident updates
    const updatesResult = await pool.query(
      `SELECT id, message, status, created_at
       FROM control_plane.incident_updates
       WHERE incident_id = $1
       ORDER BY created_at DESC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      incident: {
        ...incident,
        updates: updatesResult.rows,
      },
    })
  } catch (error: unknown) {
    console.error('[Incident] Error fetching incident:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch incident'

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
        error: 'Failed to fetch incident',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Authenticate the request
    const developer = await authenticateAndGetDeveloper(req)

    // Authorize - only operators and admins can update incidents
    await requireOperatorOrAdmin(developer)

    const body = await req.json()
    const { status, title, description, impact, resolved_at } = body

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'resolved', 'maintenance']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        )
      }
    }

    // Validate impact if provided
    if (impact) {
      const validImpacts = ['high', 'medium', 'low']
      if (!validImpacts.includes(impact)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid impact. Must be one of: ${validImpacts.join(', ')}`,
            code: 'INVALID_IMPACT',
          },
          { status: 400 }
        )
      }
    }

    const pool = getPool()

    // Build update query dynamically based on provided fields
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`)
      updateValues.push(status)

      // If status is resolved and resolved_at not provided, set it to now
      if (status === 'resolved' && !resolved_at) {
        updateFields.push(`resolved_at = NOW()`)
      } else if (status === 'active') {
        updateFields.push(`resolved_at = NULL`)
      }
    }

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`)
      updateValues.push(title)
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`)
      updateValues.push(description)
    }

    if (impact !== undefined) {
      updateFields.push(`impact = $${paramIndex++}`)
      updateValues.push(impact)
    }

    if (resolved_at !== undefined) {
      updateFields.push(`resolved_at = $${paramIndex++}`)
      updateValues.push(resolved_at)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No fields to update',
          code: 'NO_FIELDS',
        },
        { status: 400 }
      )
    }

    updateValues.push(id)

    const result = await pool.query(
      `UPDATE control_plane.incidents
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, service, status, title, description, impact, started_at, resolved_at, affected_services, created_at`,
      updateValues
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incident not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Incident updated',
      incident: result.rows[0],
    })
  } catch (error: unknown) {
    console.error('[Incident] Error updating incident:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update incident'

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
        error: 'Failed to update incident',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

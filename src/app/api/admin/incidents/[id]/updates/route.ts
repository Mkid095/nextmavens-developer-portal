/**
 * POST /api/admin/incidents/[id]/updates
 * GET /api/admin/incidents/[id]/updates
 *
 * Add and list incident updates (admin only)
 *
 * Allows operators and admins to add progress updates to incidents.
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Authenticate the request
    const developer = await authenticateAndGetDeveloper(req)

    // Authorize - only operators and admins can add incident updates
    await requireOperatorOrAdmin(developer)

    const body = await req.json()
    const { message, status } = body

    // Validate required fields
    if (!message || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: message, status',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      )
    }

    const pool = getPool()

    // Verify incident exists
    const incidentResult = await pool.query(
      'SELECT id FROM control_plane.incidents WHERE id = $1',
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

    // Create incident update
    const result = await pool.query(
      `INSERT INTO control_plane.incident_updates
       (incident_id, message, status, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, incident_id, message, status, created_at`,
      [id, message, status, developer.id]
    )

    const update = result.rows[0]

    return NextResponse.json({
      success: true,
      message: 'Incident update added',
      update,
    })
  } catch (error: unknown) {
    console.error('[Incident Updates] Error adding incident update:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add incident update'

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
        error: 'Failed to add incident update',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
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

    // Authorize - only operators and admins can view incident updates
    await requireOperatorOrAdmin(developer)

    const pool = getPool()

    // Get incident updates
    const result = await pool.query(
      `SELECT id, incident_id, message, status, created_at
       FROM control_plane.incident_updates
       WHERE incident_id = $1
       ORDER BY created_at DESC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      updates: result.rows,
    })
  } catch (error: unknown) {
    console.error('[Incident Updates] Error fetching incident updates:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch incident updates'

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
        error: 'Failed to fetch incident updates',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

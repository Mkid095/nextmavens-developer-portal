/**
 * GET/PUT /api/admin/support/requests/{id}
 *
 * Get a single support request or update its status (admin only).
 *
 * GET: Returns full support request details
 * PUT: Updates support request status and adds optional admin notes
 *
 * Request body for PUT:
 * - status: open | in_progress | resolved | closed
 * - admin_notes: Optional notes from admin
 *
 * Returns:
 * - request: Support request object
 *
 * US-010: Create Admin Support UI
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { getPool } from '@/lib/db'

interface UpdateStatusRequest {
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  admin_notes?: string
}

interface SupportRequestDetail {
  id: string
  project_id: string
  project_name: string
  tenant_slug: string
  user_id: string
  user_email: string
  user_name: string
  subject: string
  description: string
  context: any
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  previous_status: string | null
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

interface SupportRequestResponse {
  request: SupportRequestDetail
}

/**
 * GET handler for fetching a single support request (admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    await requireOperatorOrAdmin(developer)

    const { id } = params
    const pool = getPool()

    // Fetch support request with full details
    const result = await pool.query(
      `SELECT sr.id, sr.project_id, p.project_name, t.slug as tenant_slug,
              sr.user_id, d.email as user_email, d.name as user_name,
              sr.subject, sr.description, sr.context, sr.status, sr.previous_status,
              sr.admin_notes, sr.created_at, sr.resolved_at
       FROM control_plane.support_requests sr
       JOIN projects p ON sr.project_id = p.id
       JOIN tenants t ON p.tenant_id = t.id
       JOIN developers d ON sr.user_id = d.id
       WHERE sr.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Support request not found' },
        { status: 404 }
      )
    }

    const row = result.rows[0]
    const request: SupportRequestDetail = {
      id: row.id,
      project_id: row.project_id,
      project_name: row.project_name,
      tenant_slug: row.tenant_slug,
      user_id: row.user_id,
      user_email: row.user_email,
      user_name: row.user_name || 'User',
      subject: row.subject,
      description: row.description,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
      status: row.status,
      previous_status: row.previous_status,
      admin_notes: row.admin_notes,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
    }

    const response: SupportRequestResponse = { request }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Admin Support] Error fetching support request:', error)

    if (err.message === 'No token provided' || err.message === 'Invalid token') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (err.message?.includes('operator or administrator')) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch support request. Please try again later.' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler for updating support request status and notes (admin only)
 * US-009: Sends notification email when status changes
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    await requireOperatorOrAdmin(developer)

    const { id } = params
    const body = (await req.json()) as UpdateStatusRequest
    const pool = getPool()

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current status
    const currentResult = await pool.query(
      `SELECT status, previous_status FROM control_plane.support_requests WHERE id = $1`,
      [id]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Support request not found' },
        { status: 404 }
      )
    }

    const previousStatus = currentResult.rows[0].status

    // Build update query
    const updateValues: any[] = [body.status, body.admin_notes || null, id]
    let updateQuery = `UPDATE control_plane.support_requests
                       SET status = $1, admin_notes = $2`

    // Set resolved_at when status is resolved
    if (body.status === 'resolved') {
      updateQuery += `, resolved_at = NOW()`
    } else if (previousStatus === 'resolved' && body.status !== 'resolved') {
      // Clear resolved_at if moving away from resolved
      updateQuery += `, resolved_at = NULL`
    }

    // Store previous status if it's changing
    if (previousStatus !== body.status) {
      updateQuery += `, previous_status = $3`
      updateValues.splice(2, 0, previousStatus)
      updateQuery += ` WHERE id = $4 RETURNING id, status, previous_status`
    } else {
      updateQuery += ` WHERE id = $3 RETURNING id, status, previous_status`
    }

    const result = await pool.query(updateQuery, updateValues)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Support request not found' },
        { status: 404 }
      )
    }

    const updatedRequest = result.rows[0]

    // US-009: Send notification email when status changes (only if status actually changed)
    if (previousStatus !== body.status) {
      // Import and call notification function
      const { sendSupportRequestNotification } = await import('@/lib/support-notifications')
      // Fire and forget - don't block the response on email delivery
      sendSupportRequestNotification(id, 'status_changed').catch(err => {
        console.error('[Admin Support] Failed to send notification email:', err)
      })
    }

    return NextResponse.json({
      success: true,
      request_id: updatedRequest.id,
      status: updatedRequest.status,
      previous_status: previousStatus,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Admin Support] Error updating support request:', error)

    if (err.message === 'No token provided' || err.message === 'Invalid token') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (err.message?.includes('operator or administrator')) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to update support request. Please try again later.' },
      { status: 500 }
    )
  }
}

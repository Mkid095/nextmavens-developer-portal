/**
 * GET /api/support/requests/{id}
 *
 * Get a single support request by ID with full details.
 *
 * Path params:
 * - id: UUID - The support request ID
 *
 * Returns:
 * - request: Support request object with full details
 *
 * US-006: Create Support Request List UI
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getPool } from '@/lib/db'
import { sendSupportRequestNotification } from '@/lib/support-notifications'

interface UpdateStatusRequest {
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
}

interface SupportRequestDetail {
  id: string
  project_id: string
  project_name: string
  user_id: string
  subject: string
  description: string
  context: any
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  resolved_at: string | null
}

interface SupportRequestResponse {
  request: SupportRequestDetail
}

/**
 * GET handler for fetching a single support request
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const { id } = params
    const pool = getPool()

    // Fetch support request with project name
    const result = await pool.query(
      `SELECT sr.id, sr.project_id, p.project_name, sr.user_id, sr.subject, sr.description, sr.context, sr.status, sr.created_at, sr.resolved_at
       FROM control_plane.support_requests sr
       JOIN projects p ON sr.project_id = p.id
       WHERE sr.id = $1 AND p.developer_id = $2`,
      [id, developer.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Support request not found or access denied' },
        { status: 404 }
      )
    }

    const row = result.rows[0]
    const request: SupportRequestDetail = {
      id: row.id,
      project_id: row.project_id,
      project_name: row.project_name,
      user_id: row.user_id,
      subject: row.subject,
      description: row.description,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
      status: row.status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
    }

    const response: SupportRequestResponse = { request }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Support Request] Error fetching support request:', error)
    return NextResponse.json(
      {
        error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to fetch support request. Please try again later.'
      },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * PUT handler for updating support request status
 * US-009: Send Support Notifications - Sends email when status changes
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
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

    // Get current status for notification
    const currentResult = await pool.query(
      `SELECT sr.status, p.developer_id
       FROM control_plane.support_requests sr
       JOIN projects p ON sr.project_id = p.id
       WHERE sr.id = $1`,
      [id]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Support request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (currentResult.rows[0].developer_id !== developer.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const previousStatus = currentResult.rows[0].status

    // Update support request status
    const updateValues: any[] = [body.status, id]
    let updateQuery = `UPDATE control_plane.support_requests SET status = $1`

    // Set resolved_at when status is closed
    const newStatus = body.status as string
    const oldStatus = previousStatus as string
    if (newStatus === 'closed') {
      updateQuery += `, resolved_at = NOW()`
    } else if (oldStatus === 'closed' && newStatus !== 'closed') {
      // Clear resolved_at if moving away from closed
      updateQuery += `, resolved_at = NULL`
    }

    // Store previous status for notifications
    updateQuery += `, previous_status = $2 WHERE id = $3 RETURNING id, status`
    updateValues.splice(1, 0, previousStatus)

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
      // Fire and forget - don't block the response on email delivery
      sendSupportRequestNotification(id, 'status_changed').catch(err => {
        console.error('[Support Request] Failed to send notification email:', err)
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
    console.error('[Support Request] Error updating support request:', error)
    return NextResponse.json(
      {
        error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to update support request. Please try again later.'
      },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

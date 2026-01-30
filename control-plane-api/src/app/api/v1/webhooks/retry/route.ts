import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'

// Validation schema for retry request
const retryWebhookSchema = {
  event_log_id: 'string',
}

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project ownership
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT developer_id FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return false
  }

  const project = result.rows[0]
  return project.developer_id === developer.id
}

// POST /v1/webhooks/retry - Retry a failed webhook delivery
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse request body
    const body = await req.json()

    // Validate request body
    if (!body.event_log_id) {
      return errorResponse('VALIDATION_ERROR', 'event_log_id is required', 400)
    }

    const { event_log_id } = body

    // Get the event log entry
    const logResult = await pool.query(
      `SELECT el.id, el.project_id, el.webhook_id, el.event_type, el.status,
              el.retry_count, el.response_code, el.response_body, el.payload,
              el.created_at, w.event as webhook_event, w.target_url, w.enabled,
              p.developer_id
       FROM control_plane.event_log el
       LEFT JOIN control_plane.webhooks w ON el.webhook_id = w.id
       LEFT JOIN projects p ON el.project_id = p.id
       WHERE el.id = $1`,
      [event_log_id]
    )

    if (logResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Event log entry not found', 404)
    }

    const eventLog = logResult.rows[0]

    // Validate project ownership
    if (eventLog.developer_id !== developer.id) {
      return errorResponse('PERMISSION_DENIED', 'You do not have access to this event log', 403)
    }

    // Check if the webhook is still enabled
    if (!eventLog.enabled) {
      return errorResponse(
        'WEBHOOK_DISABLED',
        'Cannot retry delivery for a disabled webhook. Enable the webhook first.',
        400
      )
    }

    // Check if the event log is in failed status
    if (eventLog.status !== 'failed') {
      return errorResponse(
        'INVALID_STATUS',
        'Can only retry failed webhook deliveries. Current status: ' + eventLog.status,
        400
      )
    }

    // Check retry count (max 5 retries allowed)
    if (eventLog.retry_count >= 5) {
      return errorResponse(
        'MAX_RETRIES_EXCEEDED',
        'Maximum retry count (5) exceeded for this webhook delivery',
        400
      )
    }

    // Reset the event log to pending status and increment retry count
    await pool.query(
      `UPDATE control_plane.event_log
       SET status = 'pending',
           retry_count = retry_count + 1,
           response_code = NULL,
           response_body = NULL,
           delivered_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [event_log_id]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: eventLog.id,
        message: 'Webhook delivery queued for retry',
        retry_count: eventLog.retry_count + 1,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error retrying webhook:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to retry webhook delivery', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'

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

// Validation schema for test webhook request
const testWebhookSchema = {
  webhook_id: String,
  test_payload: Object, // optional
}

// POST /v1/webhooks/test - Test a webhook by sending a test event
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse and validate request body
    const body = await req.json()

    // Basic validation
    if (!body.webhook_id || typeof body.webhook_id !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'webhook_id is required', 400)
    }

    const webhookId = body.webhook_id

    // Validate webhook ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(webhookId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid webhook ID format', 400)
    }

    // Query webhook with project ownership check
    const webhookResult = await pool.query(
      `SELECT
        w.id, w.project_id, w.event, w.target_url, w.secret, w.enabled,
        p.developer_id, p.project_name
      FROM control_plane.webhooks w
      LEFT JOIN projects p ON w.project_id = p.id
      WHERE w.id = $1`,
      [webhookId]
    )

    if (webhookResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Webhook not found', 404)
    }

    const webhook = webhookResult.rows[0]

    // Check ownership
    if (webhook.developer_id !== developer.id) {
      return errorResponse('PERMISSION_DENIED', 'You do not have access to this webhook', 403)
    }

    // Check if webhook is enabled
    if (!webhook.enabled) {
      return errorResponse('WEBHOOK_DISABLED', 'Webhook is disabled. Enable it before testing.', 400)
    }

    // Create test payload
    const testPayload = body.test_payload || {
      test: true,
      event: webhook.event,
      project_id: webhook.project_id,
      project_name: webhook.project_name,
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook event',
    }

    // Generate signature
    const crypto = require('crypto')
    const payloadString = JSON.stringify(testPayload)
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex')

    // Send test webhook
    const startTime = Date.now()
    let responseCode: number
    let responseBody: string
    let success = false

    try {
      const response = await fetch(webhook.target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': webhook.event,
          'X-Webhook-Test': 'true',
          'User-Agent': 'NextMavens-Webhook-Test/1.0',
        },
        body: payloadString,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      responseCode = response.status
      responseBody = await response.text()
      success = response.ok
    } catch (error) {
      responseCode = 0
      responseBody = error instanceof Error ? error.message : 'Unknown error'
      success = false
    }

    const duration = Date.now() - startTime

    // Log the test delivery (optional - for audit purposes)
    await pool.query(
      `INSERT INTO control_plane.event_log (project_id, webhook_id, event_type, payload, status, response_code, response_body, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        webhook.project_id,
        webhook.id,
        webhook.event,
        JSON.stringify({ ...testPayload, test: true }),
        success ? 'delivered' : 'failed',
        responseCode,
        responseBody?.substring(0, 1000), // Limit response body size
        new Date(),
      ]
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Webhook test successful! Received HTTP ${responseCode} response in ${duration}ms`,
        result: {
          statusCode: responseCode,
          duration,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Webhook test failed. ${responseCode > 0 ? `Received HTTP ${responseCode}` : 'Connection error'}: ${responseBody?.substring(0, 200) || 'Unknown error'}`,
          result: {
            statusCode: responseCode,
            duration,
          },
        },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error testing webhook:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to test webhook', 500)
  }
}

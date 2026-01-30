import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateWebhookSchema } from '@/lib/validation'

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

// GET /v1/webhooks/:id - Get webhook details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const webhookId = params.id

    // Validate webhook ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(webhookId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid webhook ID format', 400)
    }

    // Query webhook with project ownership check
    const result = await pool.query(
      `SELECT
        w.id, w.project_id, w.event, w.target_url, w.enabled, w.created_at,
        p.developer_id, p.project_name
      FROM control_plane.webhooks w
      LEFT JOIN projects p ON w.project_id = p.id
      WHERE w.id = $1`,
      [webhookId]
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Webhook not found', 404)
    }

    const webhook = result.rows[0]

    // Check ownership
    if (webhook.developer_id !== developer.id) {
      return errorResponse('PERMISSION_DENIED', 'You do not have access to this webhook', 403)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        project_id: webhook.project_id,
        project_name: webhook.project_name,
        event: webhook.event,
        target_url: webhook.target_url,
        enabled: webhook.enabled,
        created_at: webhook.created_at,
        // Never return the secret in GET responses
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting webhook details:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get webhook details', 500)
  }
}

// PUT /v1/webhooks/:id - Update webhook
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const webhookId = params.id

    // Validate webhook ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(webhookId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid webhook ID format', 400)
    }

    // Parse and validate request body
    const body = await req.json()

    let validatedBody
    try {
      validatedBody = updateWebhookSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Query webhook with project ownership check
    const webhookResult = await pool.query(
      `SELECT
        w.id, w.project_id, w.event, w.target_url, w.enabled,
        p.developer_id
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

    // Build update query dynamically based on provided fields
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (validatedBody.event !== undefined) {
      updateFields.push(`event = $${paramIndex++}`)
      updateValues.push(validatedBody.event)
    }

    if (validatedBody.target_url !== undefined) {
      updateFields.push(`target_url = $${paramIndex++}`)
      updateValues.push(validatedBody.target_url)
    }

    if (validatedBody.secret !== undefined) {
      updateFields.push(`secret = $${paramIndex++}`)
      updateValues.push(validatedBody.secret)
    }

    if (validatedBody.enabled !== undefined) {
      updateFields.push(`enabled = $${paramIndex++}`)
      updateValues.push(validatedBody.enabled)
    }

    if (updateFields.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400)
    }

    updateValues.push(webhookId)

    // Update webhook
    const result = await pool.query(
      `UPDATE control_plane.webhooks
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, project_id, event, target_url, enabled, created_at`,
      updateValues
    )

    const updatedWebhook = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWebhook.id,
        project_id: updatedWebhook.project_id,
        event: updatedWebhook.event,
        target_url: updatedWebhook.target_url,
        enabled: updatedWebhook.enabled,
        created_at: updatedWebhook.created_at,
        // Don't return secret in update response
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error updating webhook:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update webhook', 500)
  }
}

// DELETE /v1/webhooks/:id - Remove webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const webhookId = params.id

    // Validate webhook ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(webhookId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid webhook ID format', 400)
    }

    // Query webhook with project ownership check
    const webhookResult = await pool.query(
      `SELECT
        w.id, w.project_id,
        p.developer_id
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

    // Delete webhook
    await pool.query('DELETE FROM control_plane.webhooks WHERE id = $1', [webhookId])

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error deleting webhook:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete webhook', 500)
  }
}

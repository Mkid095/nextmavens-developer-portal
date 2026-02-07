import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateWebhookSchema, type UpdateWebhookInput } from '@/lib/validation'
import { getWebhook, updateWebhook, deleteWebhook } from '@/features/webhooks'
import { createAuditLog } from '@/features/audit'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate webhook ownership
async function validateWebhookOwnership(
  webhookId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; webhook?: any; project?: any }> {
  const pool = getPool()

  const webhookResult = await pool.query(
    'SELECT * FROM control_plane.webhooks WHERE id = $1',
    [webhookId]
  )

  if (webhookResult.rows.length === 0) {
    return { valid: false }
  }

  const webhook = webhookResult.rows[0]

  // Validate project ownership
  const projectResult = await pool.query(
    'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
    [webhook.project_id]
  )

  if (projectResult.rows.length === 0) {
    return { valid: false }
  }

  const project = projectResult.rows[0]

  // Personal project: check if user is the owner
  if (!project.organization_id) {
    if (String(project.developer_id) !== String(developer.id)) {
      return { valid: false, project }
    }
    return { valid: true, webhook, project }
  }

  // Organization project: check if user is a member
  const membershipCheck = await pool.query(
    `SELECT 1 FROM control_plane.organization_members
     WHERE org_id = $1 AND user_id = $2 AND status = 'accepted'
     LIMIT 1`,
    [project.organization_id, developer.id]
  )

  if (membershipCheck.rows.length === 0) {
    return { valid: false, project }
  }

  return { valid: true, webhook, project }
}

// GET /v1/webhooks/:id - Get a specific webhook by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const webhookId = params.id

    // Validate webhook ownership
    const validation = await validateWebhookOwnership(webhookId, developer)
    if (!validation.valid) {
      return errorResponse('NOT_FOUND', 'Webhook not found', 404)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: validation.webhook.id,
        project_id: validation.webhook.project_id,
        event: validation.webhook.event,
        target_url: validation.webhook.target_url,
        // Secret is not returned in GET requests for security
        enabled: validation.webhook.enabled,
        created_at: validation.webhook.created_at,
        updated_at: validation.webhook.updated_at,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Webhooks API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch webhook', 500)
  }
}

// PUT /v1/webhooks/:id - Update a webhook
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const webhookId = params.id
    const body = await req.json()

    // Validate request body
    let validatedData: UpdateWebhookInput
    try {
      validatedData = updateWebhookSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Validate webhook ownership
    const validation = await validateWebhookOwnership(webhookId, developer)
    if (!validation.valid) {
      return errorResponse('NOT_FOUND', 'Webhook not found', 404)
    }

    // Update webhook
    const { success, webhook, error } = await updateWebhook(webhookId, validatedData)

    if (!success) {
      console.error('[Webhooks API] Error updating webhook:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to update webhook', 500)
    }

    // Create audit log
    await createAuditLog({
      actor_id: developer.id,
      actor_type: 'user',
      action: 'webhook.updated',
      target_type: 'webhook',
      target_id: webhookId,
      project_id: validation.project.id,
      metadata: validatedData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        project_id: webhook.project_id,
        event: webhook.event,
        target_url: webhook.target_url,
        enabled: webhook.enabled,
        updated_at: webhook.updated_at,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Webhooks API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update webhook', 500)
  }
}

// DELETE /v1/webhooks/:id - Delete a webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const webhookId = params.id

    // Validate webhook ownership
    const validation = await validateWebhookOwnership(webhookId, developer)
    if (!validation.valid) {
      return errorResponse('NOT_FOUND', 'Webhook not found', 404)
    }

    // Delete webhook
    const { success, error } = await deleteWebhook(webhookId)

    if (!success) {
      console.error('[Webhooks API] Error deleting webhook:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to delete webhook', 500)
    }

    // Create audit log
    await createAuditLog({
      actor_id: developer.id,
      actor_type: 'user',
      action: 'webhook.deleted',
      target_type: 'webhook',
      target_id: webhookId,
      project_id: validation.project.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: webhookId,
        deleted: true,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Webhooks API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete webhook', 500)
  }
}

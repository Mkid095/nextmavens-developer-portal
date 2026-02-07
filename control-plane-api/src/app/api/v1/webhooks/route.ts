import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { listWebhooksQuerySchema, createWebhookSchema, type ListWebhooksQuery, type CreateWebhookInput } from '@/lib/validation'
import { listWebhooks, createWebhook } from '@/features/webhooks'
import { createAuditLog } from '@/features/audit'
import { getIdempotencyKey, getIdempotencyKeySuffix, withIdempotencyWithKey, type IdempotencyResponse } from '@/lib/idempotency'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project ownership/access
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  const project = result.rows[0]

  // Personal project: check if user is the owner
  if (!project.organization_id) {
    if (String(project.developer_id) !== String(developer.id)) {
      return { valid: false, project }
    }
    return { valid: true, project }
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

  return { valid: true, project }
}

// GET /v1/webhooks - List webhooks with filters
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListWebhooksQuery = {
      limit: 50,
      offset: 0,
    }
    try {
      query = listWebhooksQuerySchema.parse(queryParams)
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

    // Validate project ownership if project_id is provided
    if (query.project_id) {
      const validation = await validateProjectOwnership(query.project_id, developer)
      if (!validation.valid) {
        return errorResponse('NOT_FOUND', 'Project not found', 404)
      }
    }

    // List webhooks with filters
    const { success, webhooks, total, error } = await listWebhooks({
      project_id: query.project_id,
      event: query.event,
      enabled: query.enabled,
      limit: query.limit,
      offset: query.offset,
    })

    if (!success) {
      console.error('[Webhooks API] Error listing webhooks:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch webhooks', 500)
    }

    return NextResponse.json({
      success: true,
      data: {
        webhooks: webhooks || [],
        total: total || 0,
        limit: query.limit || 50,
        offset: query.offset || 0,
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
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch webhooks', 500)
  }
}

// POST /v1/webhooks - Create a new webhook
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: CreateWebhookInput
    try {
      validatedData = createWebhookSchema.parse(body)
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

    // Validate project ownership
    const validation = await validateProjectOwnership(validatedData.project_id, developer)
    if (!validation.valid) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    // Generate idempotency key: create_webhook:{project_id}:{event}:{target_url}
    const idempotencyKey = getIdempotencyKey(
      'create_webhook',
      req.headers,
      `${validatedData.project_id}:${validatedData.event}:${validatedData.target_url}`
    )

    // Execute with idempotency (TTL: 1 hour = 3600 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const pool = getPool()

        // Create webhook
        const { success, webhook, error } = await createWebhook({
          project_id: validatedData.project_id,
          event: validatedData.event,
          target_url: validatedData.target_url,
          secret: validatedData.secret,
          enabled: validatedData.enabled ?? true,
        })

        if (!success) {
          return {
            status: 500,
            headers: {},
            body: {
              success: false,
              error: { code: 'INTERNAL_ERROR', message: 'Failed to create webhook' }
            }
          }
        }

        // Create audit log
        await createAuditLog({
          actor_id: developer.id,
          actor_type: 'user',
          action: 'webhook.created',
          target_type: 'webhook',
          target_id: webhook.id,
          project_id: validatedData.project_id,
          metadata: {
            event: validatedData.event,
            target_url: validatedData.target_url,
          },
        })

        return {
          status: 201,
          headers: {},
          body: {
            success: true,
            data: {
              id: webhook.id,
              project_id: webhook.project_id,
              event: webhook.event,
              target_url: webhook.target_url,
              secret: webhook.secret, // Only returned on creation
              enabled: webhook.enabled,
              created_at: webhook.created_at,
              updated_at: webhook.updated_at,
            }
          }
        }
      },
      { ttl: 3600 } // 1 hour TTL
    )

    // Return the response with the appropriate status code and idempotency key header
    return NextResponse.json(result.body, {
      status: result.status,
      headers: {
        'Idempotency-Key': getIdempotencyKeySuffix(returnedKey),
        ...result.headers,
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
    return errorResponse('INTERNAL_ERROR', 'Failed to create webhook', 500)
  }
}

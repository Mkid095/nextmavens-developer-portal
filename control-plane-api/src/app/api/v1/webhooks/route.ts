import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { randomBytes } from 'crypto'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  createWebhookSchema,
  listWebhooksQuerySchema,
  type ListWebhooksQuery,
} from '@/lib/validation'

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

// GET /v1/webhooks - List webhooks for project
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListWebhooksQuery = {}
    try {
      query = listWebhooksQuerySchema.parse(queryParams)
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

    // Build query with filters
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // If project_id is provided, validate ownership and filter by it
    if (query.project_id) {
      const hasAccess = await validateProjectOwnership(query.project_id, developer)
      if (!hasAccess) {
        return errorResponse('PERMISSION_DENIED', 'You do not have access to this project', 403)
      }
      conditions.push(`w.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    } else {
      // If no project_id filter, only show webhooks for user's projects
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    // Filter by event type
    if (query.event) {
      conditions.push(`w.event = $${paramIndex++}`)
      values.push(query.event)
    }

    // Filter by enabled status
    if (query.enabled !== undefined) {
      conditions.push(`w.enabled = $${paramIndex++}`)
      values.push(query.enabled)
    }

    const limit = query.limit
    const offset = query.offset

    values.push(limit, offset)

    // Get webhooks with project details
    const result = await pool.query(
      `SELECT
        w.id, w.project_id, w.event, w.target_url, w.enabled, w.created_at,
        p.project_name
      FROM control_plane.webhooks w
      LEFT JOIN projects p ON w.project_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY w.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        project_id: row.project_id,
        project_name: row.project_name,
        event: row.event,
        target_url: row.target_url,
        enabled: row.enabled,
        created_at: row.created_at,
        // Never return the secret in list responses
      })),
      meta: {
        limit,
        offset,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing webhooks:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list webhooks', 500)
  }
}

// POST /v1/webhooks - Register webhook URL for events
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse and validate request body
    const body = await req.json()

    let validatedBody
    try {
      validatedBody = createWebhookSchema.parse(body)
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

    // Validate project ownership
    const hasAccess = await validateProjectOwnership(validatedBody.project_id, developer)
    if (!hasAccess) {
      return errorResponse('PERMISSION_DENIED', 'You do not have access to this project', 403)
    }

    // Generate secret if not provided
    const secret = validatedBody.secret || randomBytes(32).toString('hex')

    // Create webhook
    const result = await pool.query(
      `INSERT INTO control_plane.webhooks (project_id, event, target_url, secret, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, project_id, event, target_url, enabled, created_at`,
      [validatedBody.project_id, validatedBody.event, validatedBody.target_url, secret, validatedBody.enabled]
    )

    const webhook = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        project_id: webhook.project_id,
        event: webhook.event,
        target_url: webhook.target_url,
        enabled: webhook.enabled,
        created_at: webhook.created_at,
        // Only return secret on creation
        secret: secret,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error creating webhook:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create webhook', 500)
  }
}

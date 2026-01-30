import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  createProjectSchema,
  listProjectsQuerySchema,
  type CreateProjectInput,
  type ListProjectsQuery,
} from '@/lib/validation'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  withIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { emitEvent } from '@/features/webhooks'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate ownership
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, project_name, tenant_id, webhook_url, allowed_origins, rate_limit, status, environment, created_at FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  const project = result.rows[0]
  if (project.developer_id !== developer.id) {
    return { valid: false, project }
  }

  return { valid: true, project }
}

// GET /v1/projects - List all projects (with filtering)
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

    let query: ListProjectsQuery = {}
    try {
      query = listProjectsQuerySchema.parse(queryParams)
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
    const conditions: string[] = ['developer_id = $1']
    const values: any[] = [developer.id]
    let paramIndex = 2

    if (query.status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(query.status)
    }

    if (query.environment) {
      conditions.push(`environment = $${paramIndex++}`)
      values.push(query.environment)
    }

    const limit = query.limit || 50
    const offset = query.offset || 0

    values.push(limit, offset)

    const result = await pool.query(
      `SELECT
        p.id, p.project_name, p.tenant_id, p.webhook_url,
        p.allowed_origins, p.rate_limit, p.status, p.environment, p.created_at,
        p.deleted_at, p.deletion_scheduled_at, p.grace_period_ends_at,
        t.slug as tenant_slug
      FROM projects p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        name: p.project_name,
        slug: p.tenant_slug,
        tenant_id: p.tenant_id,
        environment: p.environment,
        webhook_url: p.webhook_url,
        allowed_origins: p.allowed_origins,
        rate_limit: p.rate_limit,
        status: p.status,
        created_at: p.created_at,
        deleted_at: p.deleted_at,
        deletion_scheduled_at: p.deletion_scheduled_at,
        grace_period_ends_at: p.grace_period_ends_at,
        recoverable_until: p.grace_period_ends_at,
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
    console.error('Error listing projects:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list projects', 500)
  }
}

// POST /v1/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: CreateProjectInput
    try {
      validatedData = createProjectSchema.parse(body)
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

    // Generate idempotency key: provision:{project_id}
    // Use the project_name from validated data as the identifier
    const idempotencyKey = getIdempotencyKey(
      'provision',
      req.headers,
      validatedData.project_name
    )

    // Execute with idempotency (TTL: 1 hour = 3600 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const pool = getPool()

        // Check if project with same name already exists for this developer
        const existingProject = await pool.query(
          'SELECT id FROM projects p JOIN tenants t ON p.tenant_id = t.id WHERE p.developer_id = $1 AND t.name = $2',
          [developer.id, validatedData.project_name]
        )

        if (existingProject.rows.length > 0) {
          return {
            status: 409,
            headers: {},
            body: {
              success: false,
              error: { code: 'DUPLICATE_PROJECT', message: 'A project with this name already exists' }
            }
          }
        }

        // Generate slug from project name
        const slug = validatedData.project_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        // Create tenant
        const tenantResult = await pool.query(
          `INSERT INTO tenants (name, slug, settings)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [validatedData.project_name, slug, {}]
        )

        const tenantId = tenantResult.rows[0].id

        // Create project
        const projectResult = await pool.query(
          `INSERT INTO projects (
             developer_id, project_name, tenant_id, environment, webhook_url, allowed_origins, rate_limit, status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, project_name, tenant_id, environment, webhook_url, allowed_origins, rate_limit, status, created_at`,
          [
            developer.id,
            validatedData.project_name,
            tenantId,
            validatedData.environment || 'prod',
            validatedData.webhook_url,
            validatedData.allowed_origins,
            1000, // default rate limit
            'active', // default status
          ]
        )

        const project = projectResult.rows[0]

        // US-007: Emit project.created event
        // Fire and forget - don't block the response on webhook delivery
        emitEvent(project.id, 'project.created', {
          project_id: project.id,
          project_name: project.project_name,
          tenant_id: project.tenant_id,
          environment: project.environment,
          developer_id: developer.id,
          created_at: project.created_at,
        }).catch(err => {
          console.error('[Projects API] Failed to emit project.created event:', err)
        })

        return {
          status: 201,
          headers: {},
          body: {
            success: true,
            data: {
              id: project.id,
              name: project.project_name,
              slug: slug,
              tenant_id: project.tenant_id,
              environment: project.environment,
              webhook_url: project.webhook_url,
              allowed_origins: project.allowed_origins,
              rate_limit: project.rate_limit,
              status: project.status,
              created_at: project.created_at,
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
    console.error('Error creating project:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create project', 500)
  }
}

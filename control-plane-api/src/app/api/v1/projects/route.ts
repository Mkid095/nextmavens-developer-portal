import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
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
import { controlPlaneProjectRepository } from '@/data'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// GET /v1/projects - List all projects (with filtering)
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

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
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Use repository to fetch projects
    const { data, total, error } = await controlPlaneProjectRepository.findByDeveloperWithOrgScoping(
      developer.id,
      {
        status: query.status,
        environment: query.environment,
        organization_id: query.organization_id,
        limit: query.limit,
        offset: query.offset,
      }
    )

    if (error) {
      console.error('Error listing projects:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to list projects', 500)
    }

    return NextResponse.json({
      success: true,
      data: data.map(p => ({
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
        organization_id: p.organization_id,
      })),
      meta: {
        limit: query.limit || 50,
        offset: query.offset || 0,
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
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
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
        // Check if project with same name already exists for this developer
        const { exists } = await controlPlaneProjectRepository.existsByNameForDeveloper(
          validatedData.project_name,
          developer.id
        )

        if (exists) {
          return {
            status: 409,
            headers: {},
            body: {
              success: false,
              error: { code: 'DUPLICATE_PROJECT', message: 'A project with this name already exists' }
            }
          }
        }

        // Create project with tenant using repository
        // Convert null values to undefined for repository
        const { data: project, error } = await controlPlaneProjectRepository.createWithTenant({
          developerId: developer.id,
          project_name: validatedData.project_name,
          environment: validatedData.environment,
          webhook_url: validatedData.webhook_url ?? undefined,
          allowed_origins: validatedData.allowed_origins ?? undefined,
        })

        if (error || !project) {
          return {
            status: 500,
            headers: {},
            body: {
              success: false,
              error: { code: 'CREATE_FAILED', message: 'Failed to create project' }
            }
          }
        }

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
              slug: project.slug,
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


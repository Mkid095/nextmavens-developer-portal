import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import {
  createOrganizationSchema,
  listOrganizationsQuerySchema,
  type CreateOrganizationInput,
  type ListOrganizationsQuery,
} from '@/lib/validation'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  withIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { controlPlaneOrganizationRepository } from '@/data'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// GET /v1/orgs - List organizations (user's organizations)
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListOrganizationsQuery = {}
    try {
      query = listOrganizationsQuerySchema.parse(queryParams)
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

    // Use repository to fetch organizations
    const { data, total, error } = await controlPlaneOrganizationRepository.findByDeveloper(developer.id, {
      limit: query.limit,
      offset: query.offset,
    })

    if (error) {
      console.error('Error listing organizations:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to list organizations', 500)
    }

    return NextResponse.json({
      success: true,
      data: data.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        owner_id: o.owner_id,
        member_count: o.member_count,
        created_at: o.created_at,
        updated_at: o.updated_at,
      })),
      meta: {
        limit: query.limit || 50,
        offset: query.offset || 0,
        total: total,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing organizations:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list organizations', 500)
  }
}

// POST /v1/orgs - Create new organization
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: CreateOrganizationInput
    try {
      validatedData = createOrganizationSchema.parse(body)
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

    // Generate slug from organization name if not provided
    const slug = validatedData.slug || validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Generate idempotency key: create_org:{slug}
    const idempotencyKey = getIdempotencyKey('create_org', req.headers, slug)

    // Execute with idempotency (TTL: 1 hour = 3600 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        // Check if organization with same slug already exists
        const { exists } = await controlPlaneOrganizationRepository.existsBySlug(slug)

        if (exists) {
          return {
            status: 409,
            headers: {},
            body: {
              success: false,
              error: { code: 'DUPLICATE_ORGANIZATION', message: 'An organization with this slug already exists' }
            }
          }
        }

        // Create organization with owner using repository
        const { data: organization, error } = await controlPlaneOrganizationRepository.createWithOwner({
          name: validatedData.name,
          slug,
          ownerId: developer.id,
        })

        if (error || !organization) {
          return {
            status: 500,
            headers: {},
            body: {
              success: false,
              error: { code: 'CREATE_FAILED', message: 'Failed to create organization' }
            }
          }
        }

        return {
          status: 201,
          headers: {},
          body: {
            success: true,
            data: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              owner_id: organization.owner_id,
              settings: organization.settings,
              created_at: organization.created_at,
              updated_at: organization.updated_at,
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
    console.error('Error creating organization:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create organization', 500)
  }
}

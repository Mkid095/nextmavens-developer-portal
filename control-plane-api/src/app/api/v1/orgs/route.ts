import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  listOrganizationsQuerySchema,
  type CreateOrganizationInput,
  type ListOrganizationsQuery,
} from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate organization ownership
async function validateOrganizationOwnership(
  orgId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; organization?: any; membership?: any }> {
  const pool = getPool()
  const result = await pool.query(
    `SELECT o.id, o.name, o.slug, o.owner_id, o.created_at,
            om.role, om.user_id
     FROM control_plane.organizations o
     LEFT JOIN control_plane.organization_members om ON om.org_id = o.id AND om.user_id = $2
     WHERE o.id = $1`,
    [orgId, developer.id]
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  const organization = result.rows[0]

  // Check if user is owner or has admin role
  const isOwner = organization.owner_id === developer.id
  const isAdmin = organization.role === 'admin' || organization.role === 'owner'

  if (!isOwner && !isAdmin) {
    return { valid: false, organization, membership: organization }
  }

  return { valid: true, organization, membership: organization }
}

// GET /v1/orgs - List organizations
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

    let query: ListOrganizationsQuery = {}
    try {
      query = listOrganizationsQuerySchema.parse(queryParams)
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

    const limit = query.limit || 50
    const offset = query.offset || 0

    // Get organizations where user is owner or member
    const result = await pool.query(
      `SELECT DISTINCT o.id, o.name, o.slug, o.owner_id, o.created_at,
       CASE WHEN o.owner_id = $1 THEN 'owner' ELSE om.role END as user_role
       FROM control_plane.organizations o
       LEFT JOIN control_plane.organization_members om ON om.org_id = o.id AND om.user_id = $1
       WHERE o.owner_id = $1 OR om.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [developer.id, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        owner_id: o.owner_id,
        user_role: o.user_role,
        created_at: o.created_at,
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
    console.error('Error listing organizations:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list organizations', 500)
  }
}

// POST /v1/orgs - Create organization
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
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    const pool = getPool()

    // Generate or use provided slug
    let slug = validatedData.slug
    if (!slug) {
      // Generate slug from organization name
      slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }

    // Ensure slug is unique - append number if duplicate exists
    let finalSlug = slug
    let counter = 1
    while (true) {
      const existingOrg = await pool.query(
        'SELECT id FROM control_plane.organizations WHERE slug = $1',
        [finalSlug]
      )

      if (existingOrg.rows.length === 0) {
        break
      }

      // If user provided a specific slug and it exists, return error
      if (validatedData.slug && counter === 1) {
        return errorResponse(
          'DUPLICATE_ORGANIZATION',
          'An organization with this slug already exists',
          409
        )
      }

      // Generate unique slug by appending counter
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Create organization
    const result = await pool.query(
      `INSERT INTO control_plane.organizations (name, slug, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, owner_id, created_at`,
      [validatedData.name, finalSlug, developer.id]
    )

    const organization = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        owner_id: organization.owner_id,
        created_at: organization.created_at,
      }
    }, { status: 201 })
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

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getUsageQuerySchema, type GetUsageQuery } from '@/lib/validation'
import { getCurrentUsage, getAggregatedUsage } from '@/features/usage-tracking'

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

// GET /v1/usage - Get usage metrics for a project
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: GetUsageQuery | undefined = undefined
    try {
      query = getUsageQuerySchema.parse(queryParams) as GetUsageQuery
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
    const validation = await validateProjectOwnership(query.project_id, developer)
    if (!validation.valid) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    // Determine time range based on period
    const now = new Date()
    let startTime: Date

    switch (query.period) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
      default:
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // Get current usage (aggregated total)
    const { success, data, error } = await getCurrentUsage(
      query.project_id,
      startTime,
      query.service,
      query.metric_type
    )

    if (!success) {
      console.error('[Usage API] Error getting current usage:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch usage metrics', 500)
    }

    // Return usage metrics
    return NextResponse.json({
      success: true,
      data: {
        project_id: query.project_id,
        period: query.period,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        metrics: data || [],
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Usage API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch usage metrics', 500)
  }
}

// GET /v1/usage/aggregated - Get time-series aggregated usage data
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    const query = getUsageQuerySchema.safeParse(body)
    if (!query.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        query.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        400
      )
    }

    const validatedQuery = query.data

    // Validate project ownership
    const validation = await validateProjectOwnership(validatedQuery.project_id, developer)
    if (!validation.valid) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    // Determine time range based on period
    const now = new Date()
    let startTime: Date
    let aggregation: 'day' | 'week' | 'month' | undefined

    switch (validatedQuery.period) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        aggregation = 'day'
        break
      case 'week':
        startTime = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000)
        aggregation = 'week'
        break
      case 'month':
      default:
        startTime = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000)
        aggregation = 'month'
        break
    }

    // Get aggregated usage
    const { success, data, error } = await getAggregatedUsage(
      validatedQuery.project_id,
      startTime,
      now,
      validatedQuery.service,
      validatedQuery.metric_type,
      aggregation
    )

    if (!success) {
      console.error('[Usage API] Error getting aggregated usage:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch aggregated usage metrics', 500)
    }

    // Return aggregated usage metrics
    return NextResponse.json({
      success: true,
      data: {
        project_id: validatedQuery.project_id,
        period: validatedQuery.period,
        aggregation,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        time_series: data || [],
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Usage API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch aggregated usage metrics', 500)
  }
}

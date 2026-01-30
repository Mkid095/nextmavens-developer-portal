import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  listUsageQuerySchema,
  usageCheckSchema,
  type ListUsageQuery,
  type UsageCheckInput,
  serviceEnum,
} from '@/lib/validation'
import { quotaExceededError, validationError } from '@/lib/errors'

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
  return result.rows[0].developer_id === developer.id
}

// GET /v1/usage - List usage metrics with filtering
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

    let query: ListUsageQuery = {}
    try {
      query = listUsageQuerySchema.parse(queryParams)
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

    // Filter by project_id (user's own projects)
    if (query.project_id) {
      // Verify ownership
      const hasAccess = await validateProjectOwnership(query.project_id, developer)
      if (!hasAccess) {
        return errorResponse('FORBIDDEN', 'You do not have permission to view usage for this project', 403)
      }
      conditions.push(`u.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    } else {
      // If no project_id specified, get all user's projects
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    // Filter by service
    if (query.service) {
      conditions.push(`u.service = $${paramIndex++}`)
      values.push(query.service)
    }

    // Filter by metric
    if (query.metric) {
      conditions.push(`u.metric = $${paramIndex++}`)
      values.push(query.metric)
    }

    // Time period filter
    let timeInterval = '1 day'
    switch (query.period) {
      case 'hour':
        timeInterval = '1 hour'
        break
      case 'day':
        timeInterval = '1 day'
        break
      case 'week':
        timeInterval = '7 days'
        break
      case 'month':
        timeInterval = '30 days'
        break
    }

    conditions.push(`u.occurred_at >= NOW() - INTERVAL '${timeInterval}'`)

    const limit = query.limit || 50
    const offset = query.offset || 0

    values.push(limit, offset)

    // Build the query
    const baseQuery = `
      FROM usage_stats u
      ${query.project_id ? '' : 'JOIN projects p ON u.project_id = p.id'}
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.occurred_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    // Try to get usage data (table may not exist yet)
    let usageData: any[] = []
    let total = 0

    try {
      // Get paginated results
      const result = await pool.query(
        `SELECT u.project_id, u.service, u.metric, u.amount, u.occurred_at,
                p.project_name, p.tenant_id
         ${baseQuery}`,
        values
      )
      usageData = result.rows

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count ${baseQuery.replace(`LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, '')}`,
        values.slice(0, -2)
      )
      total = parseInt(countResult.rows[0].count) || 0
    } catch (dbError: any) {
      // Table may not exist, return empty results
      if (dbError.code === '42P01') {
        // Table doesn't exist, return empty results
        return NextResponse.json({
          success: true,
          data: [],
          warnings: ['Usage tracking is not enabled. No usage data available.'],
          meta: {
            limit,
            offset,
            total: 0,
          }
        })
      }
      throw dbError
    }

    // Aggregate usage by service and metric
    const aggregated: Record<string, any> = {}
    for (const row of usageData) {
      const key = `${row.service}.${row.metric}`
      if (!aggregated[key]) {
        aggregated[key] = {
          service: row.service,
          metric: row.metric,
          total_amount: 0,
          count: 0,
          project_ids: new Set<string>(),
        }
      }
      aggregated[key].total_amount += row.amount || 0
      aggregated[key].count += 1
      if (row.project_id) {
        aggregated[key].project_ids.add(row.project_id)
      }
    }

    const aggregatedData = Object.values(aggregated).map((item: any) => ({
      service: item.service,
      metric: item.metric,
      total_amount: item.total_amount,
      request_count: item.count,
      unique_projects: item.project_ids.size,
    }))

    return NextResponse.json({
      success: true,
      data: usageData.map((row: any) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        tenant_id: row.tenant_id,
        service: row.service,
        metric: row.metric,
        amount: row.amount,
        occurred_at: row.occurred_at,
      })),
      aggregated: aggregatedData,
      meta: {
        limit,
        offset,
        total,
        period: query.period,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing usage:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list usage', 500)
  }
}

// POST /v1/usage/check - Check if operation is within quota
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: UsageCheckInput
    try {
      validatedData = usageCheckSchema.parse(body)
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

    // Verify project ownership
    const hasAccess = await validateProjectOwnership(validatedData.project_id, developer)
    if (!hasAccess) {
      return errorResponse('FORBIDDEN', 'You do not have permission to check usage for this project', 403)
    }

    const pool = getPool()

    // Get quota limits for the project
    const quotaResult = await pool.query(
      `SELECT db_queries_per_day, realtime_connections, storage_uploads_per_day, function_invocations_per_day
       FROM quotas
       WHERE project_id = $1`,
      [validatedData.project_id]
    )

    let quotas: any = {
      db_queries_per_day: 10000,
      realtime_connections: 100,
      storage_uploads_per_day: 1000,
      function_invocations_per_day: 5000,
    }

    if (quotaResult.rows.length > 0) {
      quotas = { ...quotas, ...quotaResult.rows[0] }
    }

    // Map metric to quota field
    const metricToQuota: Record<string, { quota: string; limit: number }> = {
      db_query: { quota: 'db_queries_per_day', limit: quotas.db_queries_per_day },
      realtime_message: { quota: 'realtime_connections', limit: quotas.realtime_connections },
      storage_upload: { quota: 'storage_uploads_per_day', limit: quotas.storage_uploads_per_day },
      function_invocation: { quota: 'function_invocations_per_day', limit: quotas.function_invocations_per_day },
    }

    const metricConfig = metricToQuota[validatedData.metric]
    if (!metricConfig) {
      return errorResponse('VALIDATION_ERROR', 'Invalid metric type for quota check', 400)
    }

    // Get current usage for the metric (today)
    let currentUsage = 0
    try {
      const usageResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM usage_stats
         WHERE project_id = $1
           AND metric = $2
           AND occurred_at >= DATE(NOW())`,
        [validatedData.project_id, validatedData.metric]
      )
      currentUsage = parseInt(usageResult.rows[0].total) || 0
    } catch (error: any) {
      // Table may not exist yet, usage is 0
      if (error.code !== '42P01') {
        throw error
      }
    }

    const newUsage = currentUsage + validatedData.amount
    const percentage = (newUsage / metricConfig.limit) * 100

    // Build response with warnings
    const warnings: string[] = []
    if (percentage >= 100) {
      if (validatedData.operation === 'increment') {
        const err = quotaExceededError(
          `Quota exceeded for ${validatedData.metric}. Current: ${currentUsage}, Limit: ${metricConfig.limit}`,
          validatedData.project_id,
          {
            metric: validatedData.metric,
            current_usage: currentUsage,
            limit: metricConfig.limit,
            percentage: Math.round(percentage),
          }
        )
        return err.toNextResponse()
      }
    } else if (percentage >= 90) {
      warnings.push(`Warning: Quota usage at ${Math.round(percentage)}% for ${validatedData.metric}`)
    } else if (percentage >= 80) {
      warnings.push(`Notice: Quota usage at ${Math.round(percentage)}% for ${validatedData.metric}`)
    }

    // If operation is 'increment', record the usage
    if (validatedData.operation === 'increment') {
      try {
        await pool.query(
          `INSERT INTO usage_stats (project_id, service, metric, amount, occurred_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [validatedData.project_id, validatedData.service, validatedData.metric, validatedData.amount]
        )
      } catch (error: any) {
        // Table may not exist, log warning
        if (error.code !== '42P01') {
          console.error('Error recording usage:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id: validatedData.project_id,
        service: validatedData.service,
        metric: validatedData.metric,
        current_usage: currentUsage,
        new_usage: newUsage,
        limit: metricConfig.limit,
        percentage: Math.round(percentage),
        within_quota: newUsage <= metricConfig.limit,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error checking usage:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to check usage', 500)
  }
}

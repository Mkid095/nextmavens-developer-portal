import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  listQuotasQuerySchema,
  updateQuotasSchema,
  type ListQuotasQuery,
  type UpdateQuotasInput,
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
): Promise<{ valid: boolean; project?: any }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, project_name, tenant_id FROM projects WHERE id = $1',
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

// GET /v1/quotas - List quotas with filtering
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

    let query: ListQuotasQuery = {}
    try {
      query = listQuotasQuerySchema.parse(queryParams)
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
      const ownership = await validateProjectOwnership(query.project_id, developer)
      if (!ownership.valid) {
        return errorResponse('FORBIDDEN', 'You do not have permission to view quotas for this project', 403)
      }
      conditions.push(`q.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    } else {
      // If no project_id specified, get all user's projects
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    const limit = query.limit || 50
    const offset = query.offset || 0

    values.push(limit, offset)

    // Check if quotas table exists, if not return default quotas
    let quotasData: any[] = []
    let total = 0

    try {
      // Get paginated results with project details
      const result = await pool.query(
        `SELECT q.project_id, q.db_queries_per_day, q.realtime_connections,
                q.storage_uploads_per_day, q.function_invocations_per_day,
                p.project_name, p.tenant_id, p.status, p.environment
         FROM quotas q
         JOIN projects p ON q.project_id = p.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY p.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      )
      quotasData = result.rows

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM quotas q
         JOIN projects p ON q.project_id = p.id
         WHERE ${conditions.join(' AND ')}`,
        values.slice(0, -2)
      )
      total = parseInt(countResult.rows[0].count) || 0
    } catch (dbError: any) {
      // Table may not exist, return empty results
      if (dbError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          warnings: ['Quotas table not found. Using default quota limits.'],
          meta: {
            limit,
            offset,
            total: 0,
          },
          default_limits: {
            db_queries_per_day: 10000,
            realtime_connections: 100,
            storage_uploads_per_day: 1000,
            function_invocations_per_day: 5000,
          }
        })
      }
      throw dbError
    }

    // Calculate current usage for each quota
    const enrichedData = await Promise.all(
      quotasData.map(async (quota: any) => {
        const usage: any = {
          db_queries: 0,
          realtime_connections: 0,
          storage_uploads: 0,
          function_invocations: 0,
        }

        try {
          // Get current usage from usage_stats (today only)
          const usageResult = await pool.query(
            `SELECT metric, SUM(amount) as total
             FROM usage_stats
             WHERE project_id = $1
               AND occurred_at >= DATE(NOW())
             GROUP BY metric`,
            [quota.project_id]
          )

          for (const row of usageResult.rows) {
            switch (row.metric) {
              case 'db_query':
                usage.db_queries = parseInt(row.total) || 0
                break
              case 'realtime_message':
                usage.realtime_connections = parseInt(row.total) || 0
                break
              case 'storage_upload':
                usage.storage_uploads = parseInt(row.total) || 0
                break
              case 'function_invocation':
                usage.function_invocations = parseInt(row.total) || 0
                break
            }
          }
        } catch (error: any) {
          // usage_stats table may not exist, usage stays at 0
          if (error.code !== '42P01') {
            console.error('Error getting usage:', error)
          }
        }

        // Calculate percentage and warnings
        const calculateWarning = (used: number, limit: number) => {
          const percentage = (used / limit) * 100
          if (percentage >= 100) return 'exceeded'
          if (percentage >= 90) return 'critical'
          if (percentage >= 80) return 'warning'
          return 'ok'
        }

        return {
          project_id: quota.project_id,
          project_name: quota.project_name,
          tenant_id: quota.tenant_id,
          status: quota.status,
          environment: quota.environment,
          quotas: {
            db_queries_per_day: quota.db_queries_per_day,
            realtime_connections: quota.realtime_connections,
            storage_uploads_per_day: quota.storage_uploads_per_day,
            function_invocations_per_day: quota.function_invocations_per_day,
          },
          usage: usage,
          warnings: {
            db_queries: calculateWarning(usage.db_queries, quota.db_queries_per_day),
            realtime_connections: calculateWarning(usage.realtime_connections, quota.realtime_connections),
            storage_uploads: calculateWarning(usage.storage_uploads, quota.storage_uploads_per_day),
            function_invocations: calculateWarning(usage.function_invocations, quota.function_invocations_per_day),
          },
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedData,
      meta: {
        limit,
        offset,
        total,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing quotas:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list quotas', 500)
  }
}

// PUT /v1/quotas/:projectId - Update project quotas
export async function PUT(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: UpdateQuotasInput
    try {
      validatedData = updateQuotasSchema.parse(body)
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

    // Get project_id from body or query params
    const projectId = body.project_id
    if (!projectId) {
      return errorResponse('VALIDATION_ERROR', 'project_id is required', 400)
    }

    // Verify ownership
    const ownership = await validateProjectOwnership(projectId, developer)
    if (!ownership.valid) {
      return errorResponse('FORBIDDEN', 'You do not have permission to update quotas for this project', 403)
    }

    const pool = getPool()

    // Check if quotas record exists
    const existingResult = await pool.query(
      'SELECT project_id FROM quotas WHERE project_id = $1',
      [projectId]
    )

    if (existingResult.rows.length === 0) {
      // Create new quotas record with defaults
      const defaultQuotas = {
        db_queries_per_day: 10000,
        realtime_connections: 100,
        storage_uploads_per_day: 1000,
        function_invocations_per_day: 5000,
      }

      const mergedQuotas = { ...defaultQuotas, ...validatedData }

      const result = await pool.query(
        `INSERT INTO quotas (project_id, db_queries_per_day, realtime_connections, storage_uploads_per_day, function_invocations_per_day)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          projectId,
          mergedQuotas.db_queries_per_day,
          mergedQuotas.realtime_connections,
          mergedQuotas.storage_uploads_per_day,
          mergedQuotas.function_invocations_per_day,
        ]
      )

      return NextResponse.json({
        success: true,
        data: {
          project_id: result.rows[0].project_id,
          quotas: {
            db_queries_per_day: result.rows[0].db_queries_per_day,
            realtime_connections: result.rows[0].realtime_connections,
            storage_uploads_per_day: result.rows[0].storage_uploads_per_day,
            function_invocations_per_day: result.rows[0].function_invocations_per_day,
          },
          created: true,
        }
      })
    } else {
      // Update existing quotas (only provided fields)
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (validatedData.db_queries_per_day !== undefined) {
        updateFields.push(`db_queries_per_day = $${paramIndex++}`)
        values.push(validatedData.db_queries_per_day)
      }
      if (validatedData.realtime_connections !== undefined) {
        updateFields.push(`realtime_connections = $${paramIndex++}`)
        values.push(validatedData.realtime_connections)
      }
      if (validatedData.storage_uploads_per_day !== undefined) {
        updateFields.push(`storage_uploads_per_day = $${paramIndex++}`)
        values.push(validatedData.storage_uploads_per_day)
      }
      if (validatedData.function_invocations_per_day !== undefined) {
        updateFields.push(`function_invocations_per_day = $${paramIndex++}`)
        values.push(validatedData.function_invocations_per_day)
      }

      if (updateFields.length === 0) {
        return errorResponse('VALIDATION_ERROR', 'No quota fields provided to update', 400)
      }

      values.push(projectId)

      const result = await pool.query(
        `UPDATE quotas
         SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE project_id = $${paramIndex}
         RETURNING *`,
        values
      )

      return NextResponse.json({
        success: true,
        data: {
          project_id: result.rows[0].project_id,
          quotas: {
            db_queries_per_day: result.rows[0].db_queries_per_day,
            realtime_connections: result.rows[0].realtime_connections,
            storage_uploads_per_day: result.rows[0].storage_uploads_per_day,
            function_invocations_per_day: result.rows[0].function_invocations_per_day,
          },
          updated: true,
        }
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error updating quotas:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update quotas', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  updateQuotasSchema,
  listUsageQuerySchema,
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

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /v1/quotas/:projectId - Get quota limits and usage for a specific project
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const projectId = params.id
    const pool = getPool()

    // Verify ownership
    const ownership = await validateProjectOwnership(projectId, developer)
    if (!ownership.valid) {
      return errorResponse('FORBIDDEN', 'You do not have permission to view quotas for this project', 403)
    }

    // Get quota limits for the project (with defaults if not set)
    let quotas: any = {
      db_queries_per_day: 10000,
      realtime_connections: 100,
      storage_uploads_per_day: 1000,
      function_invocations_per_day: 5000,
    }

    try {
      const quotaResult = await pool.query(
        `SELECT db_queries_per_day, realtime_connections, storage_uploads_per_day, function_invocations_per_day
         FROM quotas
         WHERE project_id = $1`,
        [projectId]
      )

      if (quotaResult.rows.length > 0) {
        quotas = { ...quotas, ...quotaResult.rows[0] }
      }
    } catch (dbError: any) {
      // Table may not exist, use defaults
      if (dbError.code !== '42P01') {
        throw dbError
      }
    }

    // Get current usage for today
    const usage: any = {
      db_queries: 0,
      realtime_connections: 0,
      storage_uploads: 0,
      function_invocations: 0,
    }

    try {
      const usageResult = await pool.query(
        `SELECT metric, SUM(amount) as total
         FROM usage_stats
         WHERE project_id = $1
           AND occurred_at >= DATE(NOW())
         GROUP BY metric`,
        [projectId]
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
    } catch (dbError: any) {
      // usage_stats table may not exist, usage stays at 0
      if (dbError.code !== '42P01') {
        console.error('Error getting usage:', dbError)
      }
    }

    // Calculate percentages and warnings
    const calculateStatus = (used: number, limit: number) => {
      const percentage = limit > 0 ? (used / limit) * 100 : 0
      return {
        used,
        limit,
        percentage: Math.round(percentage),
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'critical' : percentage >= 80 ? 'warning' : 'ok',
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        quotas: {
          db_queries_per_day: quotas.db_queries_per_day,
          realtime_connections: quotas.realtime_connections,
          storage_uploads_per_day: quotas.storage_uploads_per_day,
          function_invocations_per_day: quotas.function_invocations_per_day,
        },
        usage: {
          db_queries: calculateStatus(usage.db_queries, quotas.db_queries_per_day),
          realtime_connections: calculateStatus(usage.realtime_connections, quotas.realtime_connections),
          storage_uploads: calculateStatus(usage.storage_uploads, quotas.storage_uploads_per_day),
          function_invocations: calculateStatus(usage.function_invocations, quotas.function_invocations_per_day),
        },
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting quotas:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get quotas', 500)
  }
}

// PUT /v1/quotas/:projectId - Update project quotas
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const projectId = params.id
    const body = await req.json()

    // Verify ownership
    const ownership = await validateProjectOwnership(projectId, developer)
    if (!ownership.valid) {
      return errorResponse('FORBIDDEN', 'You do not have permission to update quotas for this project', 403)
    }

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

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  listAuditQuerySchema,
  type ListAuditQuery,
} from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project access
async function validateProjectAccess(
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

// Helper function to convert audit log to CSV row
function auditLogToCsvRow(log: any): string {
  const timestamp = new Date(log.created_at).toISOString()
  const actorName = log.actor_name || log.actor_email || log.actor_type
  const metadataStr = JSON.stringify(log.metadata).replace(/"/g, '""')

  // Escape CSV fields according to RFC 4180
  const escape = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  return [
    escape(timestamp),
    escape(log.actor_id || ''),
    escape(actorName),
    escape(log.actor_type),
    escape(log.action),
    escape(log.target_type),
    escape(log.target_id || ''),
    escape(metadataStr),
    escape(log.ip_address || ''),
    escape(log.request_id || ''),
    escape(log.project_id || ''),
  ].join(',')
}

// GET /v1/audit/export - Export audit logs to CSV
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

    let query: ListAuditQuery = {}
    try {
      query = listAuditQuerySchema.parse(queryParams)
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

    // If project_id is provided, validate access and filter by it
    if (query.project_id) {
      const hasAccess = await validateProjectAccess(query.project_id, developer)
      if (!hasAccess) {
        return errorResponse('PERMISSION_DENIED', 'You do not have access to this project', 403)
      }
      conditions.push(`al.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    }

    // Filter by actor_id
    if (query.actor_id) {
      conditions.push(`al.actor_id = $${paramIndex++}`)
      values.push(query.actor_id)
    }

    // Filter by actor_type
    if (query.actor_type) {
      conditions.push(`al.actor_type = $${paramIndex++}`)
      values.push(query.actor_type)
    }

    // Filter by action
    if (query.action) {
      conditions.push(`al.action = $${paramIndex++}`)
      values.push(query.action)
    }

    // Filter by target_type
    if (query.target_type) {
      conditions.push(`al.target_type = $${paramIndex++}`)
      values.push(query.target_type)
    }

    // Filter by target_id
    if (query.target_id) {
      conditions.push(`al.target_id = $${paramIndex++}`)
      values.push(query.target_id)
    }

    // Filter by request_id
    if (query.request_id) {
      conditions.push(`al.request_id = $${paramIndex++}`)
      values.push(query.request_id)
    }

    // Filter by date range
    if (query.start_date) {
      conditions.push(`al.created_at >= $${paramIndex++}`)
      values.push(query.start_date)
    }

    if (query.end_date) {
      conditions.push(`al.created_at <= $${paramIndex++}`)
      values.push(query.end_date)
    }

    // If no project filter and no actor_id filter, only show logs for user's projects
    if (!query.project_id && !query.actor_id) {
      conditions.push(`p.developer_id = $${paramIndex++}`)
      values.push(developer.id)
    }

    // For export, we may want to fetch more records than default
    // Use a higher limit for export (up to 10000)
    const exportLimit = Math.min(query.limit, 10000)
    const offset = query.offset

    values.push(exportLimit, offset)

    // Get audit logs with actor names
    const result = await pool.query(
      `SELECT
        al.id, al.actor_id, al.actor_type, al.action,
        al.target_type, al.target_id, al.metadata,
        al.ip_address, al.user_agent, al.request_id,
        al.project_id, al.created_at,
        d.name as actor_name, d.email as actor_email,
        p.project_name
      FROM control_plane.audit_logs al
      LEFT JOIN developers d ON al.actor_id = d.id AND al.actor_type = 'user'
      LEFT JOIN projects p ON al.project_id = p.id
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    // Generate CSV
    const headers = ['timestamp', 'actor_id', 'actor', 'actor_type', 'action', 'target_type', 'target_id', 'metadata', 'ip_address', 'request_id', 'project_id']
    const csvRows = [
      headers.join(','),
      ...result.rows.map(auditLogToCsvRow),
    ]

    const csv = csvRows.join('\n')

    // Return CSV file with appropriate headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error exporting audit logs:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to export audit logs', 500)
  }
}

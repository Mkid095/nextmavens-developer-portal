/**
 * GET /api/support/requests?project_id={uuid}&status={open|in_progress|resolved|closed}
 *
 * Get support requests for a project with optional status filter.
 *
 * Query params:
 * - project_id: UUID - The project ID (required)
 * - status: string - Optional status filter (open, in_progress, resolved, closed)
 *
 * Returns:
 * - requests: Array of support request objects
 *
 * US-006: Create Support Request List UI
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getPool } from '@/lib/db'

interface SupportRequest {
  id: string
  project_id: string
  user_id: string
  subject: string
  description: string
  context: any
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  resolved_at: string | null
}

interface SupportRequestsResponse {
  requests: SupportRequest[]
}

/**
 * Validate query parameters
 */
function validateQueryParams(searchParams: URLSearchParams): {
  valid: boolean
  error?: string
  projectId?: string
  status?: string
} {
  const projectId = searchParams.get('project_id')
  const status = searchParams.get('status')

  if (!projectId) {
    return { valid: false, error: 'project_id is required' }
  }

  if (status && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return { valid: false, error: 'Invalid status. Must be one of: open, in_progress, resolved, closed' }
  }

  return { valid: true, projectId, status: status || undefined }
}

/**
 * GET handler for fetching support requests
 */
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const { searchParams } = new URL(req.url)

    // Validate query parameters
    const validation = validateQueryParams(searchParams)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { projectId, status } = validation
    const pool = getPool()

    // Verify project ownership
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Build query with optional status filter
    let query = `
      SELECT id, project_id, user_id, subject, description, context, status, created_at, resolved_at
      FROM control_plane.support_requests
      WHERE project_id = $1
    `
    const params: any[] = [projectId]

    if (status) {
      query += ' AND status = $2'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, params)

    const requests: SupportRequest[] = result.rows.map((row: any) => ({
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      subject: row.subject,
      description: row.description,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
      status: row.status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
    }))

    const response: SupportRequestsResponse = { requests }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Support Requests] Error fetching support requests:', error)
    return NextResponse.json(
      {
        error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to fetch support requests. Please try again later.'
      },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

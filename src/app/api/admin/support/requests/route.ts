/**
 * GET /api/admin/support/requests
 *
 * Get all support requests for admin dashboard.
 * Supports filtering by status and project.
 *
 * Query params:
 * - status: Optional filter by status (open, in_progress, resolved, closed)
 * - project_id: Optional filter by project ID
 * - limit: Optional limit (default 50)
 * - offset: Optional offset for pagination (default 0)
 *
 * Returns:
 * - requests: Array of support requests with project and user info
 * - total: Total count of matching requests
 *
 * US-010: Create Admin Support UI
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { getPool } from '@/lib/db'

interface SupportRequestAdmin {
  id: string
  project_id: string
  project_name: string
  tenant_slug: string
  user_id: string
  user_email: string
  user_name: string
  subject: string
  description: string
  context: any
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  previous_status: string | null
  created_at: string
  resolved_at: string | null
}

interface SupportRequestsResponse {
  requests: SupportRequestAdmin[]
  total: number
}

/**
 * GET handler for fetching all support requests (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    await requireOperatorOrAdmin(developer)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const pool = getPool()

    // Build query conditions
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      conditions.push(`sr.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (projectId) {
      conditions.push(`sr.project_id = $${paramIndex}`)
      params.push(projectId)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM control_plane.support_requests sr
       ${whereClause}`,
      params
    )

    const total = parseInt(countResult.rows[0].total, 10)

    // Get paginated results
    const result = await pool.query(
      `SELECT sr.id, sr.project_id, p.project_name, t.slug as tenant_slug,
              sr.user_id, d.email as user_email, d.name as user_name,
              sr.subject, sr.description, sr.context, sr.status, sr.previous_status,
              sr.created_at, sr.resolved_at
       FROM control_plane.support_requests sr
       JOIN projects p ON sr.project_id = p.id
       JOIN tenants t ON p.tenant_id = t.id
       JOIN developers d ON sr.user_id = d.id
       ${whereClause}
       ORDER BY sr.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    const requests: SupportRequestAdmin[] = result.rows.map((row: any) => ({
      id: row.id,
      project_id: row.project_id,
      project_name: row.project_name,
      tenant_slug: row.tenant_slug,
      user_id: row.user_id,
      user_email: row.user_email,
      user_name: row.user_name || 'User',
      subject: row.subject,
      description: row.description,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
      status: row.status,
      previous_status: row.previous_status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
    }))

    const response: SupportRequestsResponse = { requests, total }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Admin Support] Error fetching support requests:', error)

    if (err.message === 'No token provided' || err.message === 'Invalid token') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (err.message?.includes('operator or administrator')) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch support requests. Please try again later.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'

/**
 * GET /api/admin/users
 *
 * List all users in the system.
 * Only operators and admins can view all users.
 *
 * Query parameters:
 * - role: Filter by role (developer, operator, admin)
 * - organization: Filter by organization
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize
    const developer = await authenticateRequest(req)
    await requireOperatorOrAdmin(developer)

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')
    const organizationFilter = searchParams.get('organization')

    const pool = getPool()

    // Build query with filters
    let query = `
      SELECT id, email, name, organization, role, created_at
      FROM developers
      WHERE 1=1
    `
    const params: string[] = []
    let paramIndex = 1

    if (roleFilter) {
      query += ` AND role = $${paramIndex}`
      params.push(roleFilter)
      paramIndex++
    }

    if (organizationFilter) {
      query += ` AND organization = $${paramIndex}`
      params.push(organizationFilter)
      paramIndex++
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, params)

    const users = result.rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      role: user.role,
      created_at: user.created_at,
    }))

    return NextResponse.json({
      users,
      total: users.length,
    })
  } catch (error: unknown) {
    console.error('[Admin Users] List users error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to list users'

    // Check for authentication/authorization errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (errorMessage.includes('operator or administrator') || errorMessage.includes('administrator privileges')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

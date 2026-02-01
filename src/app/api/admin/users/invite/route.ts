import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { requireAdmin } from '@/features/abuse-controls/lib/authorization'
import { logUserAction, userActor } from '@nextmavenspacks/audit-logs-database'
import { UserRole } from '@/features/abuse-controls/lib/authorization'

/**
 * POST /api/admin/users/invite
 *
 * Invite a new user to the platform.
 * Only admins can invite users.
 *
 * Request body:
 * {
 *   "email": string,
 *   "name": string,
 *   "organization": string,
 *   "role": "developer" | "operator" | "admin"
 * }
 *
 * This endpoint creates a new developer account with the specified role.
 * In a production system, this would send an invitation email instead.
 */
export async function POST(req: NextRequest) {
  let pool
  try {
    // Authenticate and authorize
    const developer = await authenticateRequest(req)
    const admin = await requireAdmin(developer)

    // Parse request body
    const body = await req.json()
    const { email, name, organization, role = UserRole.DEVELOPER } = body

    // Validation
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.ADMIN]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    pool = getPool()

    // Check if developer already exists
    const existingDeveloper = await pool.query(
      'SELECT id, email, name, organization, role FROM developers WHERE email = $1',
      [email]
    )

    if (existingDeveloper.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Create new developer with a temporary password
    // In production, this would generate an invitation token and send email
    const tempPassword = Math.random().toString(36).slice(-8)
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const result = await pool.query(
      `INSERT INTO developers (email, password_hash, name, organization, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, organization, role, created_at`,
      [email, passwordHash, name, organization, role]
    )

    const newUser = result.rows[0]

    // Log user invitation
    try {
      await logUserAction.invited(
        userActor(admin.id),
        newUser.id,
        newUser.role,
        newUser.organization || 'default',
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
          metadata: {
            email: newUser.email,
            name: newUser.name,
          },
        }
      )
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('[Admin Users] Failed to log user invitation:', auditError)
    }

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          organization: newUser.organization,
          role: newUser.role,
          created_at: newUser.created_at,
        },
        message: 'User invited successfully',
        // In production, return invitation token instead of password
        tempPassword, // Only for development - remove in production
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('[Admin Users] Invite user error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to invite user'

    // Check for authentication/authorization errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (errorMessage.includes('administrator privileges')) {
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

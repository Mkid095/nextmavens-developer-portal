import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPool } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'

const REFRESH_SECRET = process.env.REFRESH_SECRET

if (!REFRESH_SECRET) {
  throw new Error('REFRESH_SECRET environment variable is required')
}

/**
 * POST /api/developer/refresh
 *
 * Refresh access token using a valid refresh token.
 *
 * This endpoint:
 * 1. Verifies the refresh token signature and expiration
 * 2. Checks that the developer still exists and is active
 * 3. Verifies the developer's project is in an active state
 * 4. Issues new access and refresh tokens (token rotation)
 *
 * Token Rotation: Each refresh returns a new refresh token.
 * Old refresh tokens remain valid until expiration for graceful transition.
 *
 * Request Body:
 * {
 *   "refreshToken": "string"
 * }
 *
 * Response (200):
 * {
 *   "accessToken": "new JWT access token (1h expiry)",
 *   "refreshToken": "new JWT refresh token (7d expiry)"
 * }
 *
 * Errors:
 * - 400: Missing refreshToken
 * - 401: Invalid/expired refreshToken
 * - 401: Developer not found
 * - 403: Project suspended/archived/deleted
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { refreshToken } = body

    // Validate request
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token signature and expiration
    let decoded: { id: string }
    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET!)
      if (!payload || typeof payload !== 'object' || !('id' in payload)) {
        throw new Error('Invalid token payload')
      }
      decoded = payload as { id: string }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Get developer from database
    const pool = getPool()
    const developerResult = await pool.query(
      `SELECT id, email, name, organization
       FROM developers
       WHERE id = $1`,
      [decoded.id]
    )

    if (developerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 401 }
      )
    }

    const developer = developerResult.rows[0]

    // Get developer's active project
    const projectResult = await pool.query(
      `SELECT id, status, developer_id
       FROM projects
       WHERE developer_id = $1
       AND status IN ('active', 'provisioning')
       ORDER BY created_at DESC
       LIMIT 1`,
      [decoded.id]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active project found for developer' },
        { status: 403 }
      )
    }

    const project = projectResult.rows[0]

    // Check project status
    const status = project.status
    if (status === 'suspended') {
      return NextResponse.json(
        { error: 'Project is suspended. Please contact support.', projectStatus: status },
        { status: 403 }
      )
    }

    if (status === 'archived') {
      return NextResponse.json(
        { error: 'Project is archived. Services are disabled.', projectStatus: status },
        { status: 403 }
      )
    }

    if (status === 'deleted') {
      return NextResponse.json(
        { error: 'Project has been deleted.', projectStatus: status },
        { status: 403 }
      )
    }

    // Generate new access and refresh tokens (token rotation)
    const accessToken = generateAccessToken(developer, project.id)
    const newRefreshToken = generateRefreshToken(developer.id)

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error('[Developer Portal] Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

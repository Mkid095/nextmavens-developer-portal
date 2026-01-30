import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { trackAuthSignin } from '@/lib/usage/auth-tracking'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, project_id } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // US-001: Require project_id in JWT
    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      )
    }

    const pool = getPool()

    const result = await pool.query(
      'SELECT * FROM developers WHERE email = $1 AND status = $2',
      [email, 'active']
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const developer = result.rows[0]

    // Verify password
    const validPassword = await bcrypt.compare(password, developer.password_hash)

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // US-001: Verify project exists and belongs to the developer
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [project_id, developer.id]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid project_id or access denied' },
        { status: 403 }
      )
    }

    // Generate tokens with project_id
    const accessToken = generateAccessToken(developer, project_id)
    const refreshToken = generateRefreshToken(developer.id)

    // US-005: Track auth signin (fire and forget)
    // Track against the project_id being used for this login
    trackAuthSignin(project_id).catch(err => {
      console.error('[Developer Portal] Failed to track signin usage:', err)
    })

    return NextResponse.json({
      developer: {
        id: developer.id,
        email: developer.email,
        name: developer.name,
        organization: developer.organization,
      },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error('[Developer Portal] Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

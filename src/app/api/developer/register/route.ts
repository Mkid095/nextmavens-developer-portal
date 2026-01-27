import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, organization } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const pool = getPool()

    // Check if developer exists
    const existingDeveloper = await pool.query(
      'SELECT id FROM developers WHERE email = $1',
      [email]
    )

    if (existingDeveloper.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create developer
    const result = await pool.query(
      `INSERT INTO developers (email, password_hash, name, organization)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, organization, created_at`,
      [email, passwordHash, name, organization]
    )

    const developer = result.rows[0]

    // Generate tokens
    const accessToken = generateAccessToken(developer)
    const refreshToken = generateRefreshToken(developer.id)

    return NextResponse.json(
      {
        developer: {
          id: developer.id,
          email: developer.email,
          name: developer.name,
          organization: developer.organization,
        },
        accessToken,
        refreshToken,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Developer Portal] Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

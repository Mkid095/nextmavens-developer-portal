import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getPool } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    // Generate tokens
    const accessToken = generateAccessToken(developer)
    const refreshToken = generateRefreshToken(developer.id)

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

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool } from '@/lib/db'
import { checkFeature } from '@/lib/features'
import {
  checkRateLimit,
  extractClientIP,
  createRateLimitError,
  getRetryAfterSeconds,
  RateLimitIdentifierType,
  type RateLimitIdentifier,
} from '@/features/abuse-controls/lib/rate-limiter'

// Rate limiting configuration for signup
const SIGNUPS_PER_HOUR_PER_ORG = 3
const SIGNUPS_PER_HOUR_PER_IP = 5
const ONE_HOUR_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    // Check if signups are enabled
    const signupsEnabled = await checkFeature('signups_enabled')
    if (!signupsEnabled) {
      return NextResponse.json(
        {
          error: 'Signups disabled',
          message: 'New user registrations are temporarily disabled. Please try again later.',
        },
        { status: 503 }
      )
    }

    const clientIP = extractClientIP(req)

    // For IP-based rate limiting during signup, we use the IP as the identifier
    const ipIdentifier: RateLimitIdentifier = {
      type: RateLimitIdentifierType.IP,
      value: clientIP,
    }

    // Check IP-based rate limit first
    const ipRateLimitResult = await checkRateLimit(
      ipIdentifier,
      SIGNUPS_PER_HOUR_PER_IP,
      ONE_HOUR_MS
    )

    if (!ipRateLimitResult.allowed) {
      const retryAfter = await getRetryAfterSeconds(ipIdentifier, ONE_HOUR_MS)

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many signup attempts from your location. Please try again later.`,
          retry_after: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': SIGNUPS_PER_HOUR_PER_IP.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': ipRateLimitResult.resetAt.toISOString(),
          },
        }
      )
    }

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

    // Check organization-based rate limit if organization is provided
    let orgRateLimitResult = null
    if (organization) {
      const orgIdentifier: RateLimitIdentifier = {
        type: RateLimitIdentifierType.ORG,
        value: organization,
      }

      orgRateLimitResult = await checkRateLimit(
        orgIdentifier,
        SIGNUPS_PER_HOUR_PER_ORG,
        ONE_HOUR_MS
      )

      if (!orgRateLimitResult.allowed) {
        const retryAfter = await getRetryAfterSeconds(orgIdentifier, ONE_HOUR_MS)

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many signup attempts for this organization. Please try again later.`,
            retry_after: retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': SIGNUPS_PER_HOUR_PER_ORG.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': orgRateLimitResult.resetAt.toISOString(),
            },
          }
        )
      }
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

    return NextResponse.json(
      {
        developer: {
          id: developer.id,
          email: developer.email,
          name: developer.name,
          organization: developer.organization,
        },
        message: 'Registration successful. Please log in with your project_id.',
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': SIGNUPS_PER_HOUR_PER_IP.toString(),
          'X-RateLimit-Remaining': ipRateLimitResult.remainingAttempts.toString(),
          'X-RateLimit-Reset': ipRateLimitResult.resetAt.toISOString(),
        },
      }
    )
  } catch (error) {
    console.error('[Developer Portal] Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

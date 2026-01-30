import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import {
  checkRateLimit,
  extractClientIP,
  createRateLimitError,
  getRetryAfterSeconds,
  RateLimitIdentifierType,
  type RateLimitIdentifier,
} from '@/features/abuse-controls/lib/rate-limiter'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import {
  getIdempotencyKey,
  withIdempotencyWithKey,
  getIdempotencyKeySuffix,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { checkFeature } from '@/lib/features'

// Rate limiting configuration
const PROJECTS_PER_HOUR_PER_ORG = 3
const PROJECTS_PER_HOUR_PER_IP = 5
const ONE_HOUR_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    // Check if provisioning is enabled
    const provisioningEnabled = await checkFeature('provisioning_enabled')
    if (!provisioningEnabled) {
      return NextResponse.json(
        {
          error: 'Provisioning disabled',
          message: 'Project provisioning is temporarily disabled. Existing projects are unaffected. Please try again later.',
        },
        { status: 503 }
      )
    }

    const developer = await authenticateRequest(req)
    const clientIP = extractClientIP(req)
    const body = await req.json()
    const { project_name, webhook_url, allowed_origins } = body

    // Validation
    if (!project_name || project_name.length < 2 || project_name.length > 100) {
      return NextResponse.json(
        { error: 'Project name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    // Generate idempotency key: provision:{project_id}
    const idempotencyKey = getIdempotencyKey(
      'provision',
      req.headers,
      `${developer.id}:${project_name}`
    )

    // Execute with idempotency (TTL: 1 hour = 3600 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const controlPlane = getControlPlaneClient()

        // Extract rate limit identifiers
        const orgIdentifier: RateLimitIdentifier = {
          type: RateLimitIdentifierType.ORG,
          value: developer.id,
        }

        const ipIdentifier: RateLimitIdentifier = {
          type: RateLimitIdentifierType.IP,
          value: clientIP,
        }

        // Check org-based rate limit
        const orgRateLimitResult = await checkRateLimit(
          orgIdentifier,
          PROJECTS_PER_HOUR_PER_ORG,
          ONE_HOUR_MS
        )

        if (!orgRateLimitResult.allowed) {
          const retryAfter = await getRetryAfterSeconds(
            orgIdentifier,
            ONE_HOUR_MS
          )

          return {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': PROJECTS_PER_HOUR_PER_ORG.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': orgRateLimitResult.resetAt.toISOString(),
            },
            body: {
              error: 'Rate limit exceeded',
              message: `You can create only ${PROJECTS_PER_HOUR_PER_ORG} projects per hour. Please try again later.`,
              retry_after: retryAfter,
            },
          }
        }

        // Check IP-based rate limit
        const ipRateLimitResult = await checkRateLimit(
          ipIdentifier,
          PROJECTS_PER_HOUR_PER_IP,
          ONE_HOUR_MS
        )

        if (!ipRateLimitResult.allowed) {
          const retryAfter = await getRetryAfterSeconds(ipIdentifier, ONE_HOUR_MS)

          return {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': PROJECTS_PER_HOUR_PER_IP.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': ipRateLimitResult.resetAt.toISOString(),
            },
            body: {
              error: 'Rate limit exceeded',
              message: `Too many project creation attempts from your location. Please try again later.`,
              retry_after: retryAfter,
            },
          }
        }

        // Call Control Plane API to create project
        try {
          const response = await controlPlane.createProject(
            { project_name, webhook_url, allowed_origins },
            req
          )

          return {
            status: 201,
            headers: {
              'X-RateLimit-Limit': PROJECTS_PER_HOUR_PER_ORG.toString(),
              'X-RateLimit-Remaining': orgRateLimitResult.remainingAttempts.toString(),
              'X-RateLimit-Reset': orgRateLimitResult.resetAt.toISOString(),
            },
            body: response,
          }
        } catch (apiError) {
          // Handle Control Plane API errors
          if (apiError instanceof Error) {
            return {
              status: 500,
              headers: {},
              body: {
                error: 'Failed to create project',
                message: apiError.message,
              },
            }
          }
          throw apiError
        }
      },
      { ttl: 3600 } // 1 hour TTL
    )

    // Return the response with the appropriate status code and headers
    const responseHeaders: Record<string, string> = {
      ...result.headers,
      'Idempotency-Key': getIdempotencyKeySuffix(returnedKey),
    }

    return NextResponse.json(result.body, {
      status: result.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error('[Developer Portal] Create project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to list projects
    const response = await controlPlane.listProjects(req)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Developer Portal] List projects error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list projects' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

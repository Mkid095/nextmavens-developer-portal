/**
 * GET /api/internal/snapshot?project_id=xxx
 *
 * Internal endpoint for data plane services to fetch control plane snapshots.
 * This is the authoritative source of truth for project state.
 *
 * No authentication required (internal endpoint).
 * Snapshots are cached with 45-second TTL for performance.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - Returns 503 Service Unavailable when snapshot fetch fails
 * - Data plane services MUST deny all requests when 503 is returned
 * - Retry-After header indicates when to retry
 *
 * Response time target: < 100ms (achieved via caching)
 *
 * US-005: Uses standardized error format for consistent error responses
 * US-009: Schema validation on all snapshot responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildSnapshot } from '@/lib/snapshot/builder'
import { getCachedSnapshot, setCachedSnapshot } from '@/lib/snapshot/cache'
import { ControlPlaneSnapshot, SnapshotMetadata } from '@/lib/snapshot/types'
import {
  validateSnapshot,
  validateSnapshotResponse,
  getValidationErrorDetails
} from '@/lib/snapshot/schema'
import { errorToHttpResponse, ProjectNotFoundError, SnapshotBuildError } from '@/lib/snapshot/errors'
import { validationError, notFoundError, internalError, rateLimitError } from '@/lib/errors'

/**
 * Snapshot response wrapper
 * US-009: Typed response with schema validation
 */
interface SnapshotResponse {
  snapshot: ControlPlaneSnapshot
  metadata: SnapshotMetadata
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract project_id from query parameters
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return validationError('Missing project_id parameter', { field: 'project_id' }).toNextResponse()
    }

    // Validate project_id format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return validationError('Invalid project_id format', {
        field: 'project_id',
        expected_format: 'UUID'
      }).toNextResponse()
    }

    // Check cache first
    let cacheHit = false
    let snapshot = getCachedSnapshot(projectId)

    if (snapshot) {
      cacheHit = true
    } else {
      // Build snapshot from database
      snapshot = await buildSnapshot(projectId)

      // US-009: Validate snapshot before caching and returning
      try {
        validateSnapshot(snapshot)
      } catch (error) {
        console.error('[Snapshot API] Schema validation failed:', error)
        throw new SnapshotBuildError(
          'Generated snapshot failed schema validation',
          error instanceof Error ? error : undefined
        )
      }

      // Cache the snapshot (45 second TTL)
      setCachedSnapshot(projectId, snapshot, 45 * 1000)
    }

    const responseTime = Date.now() - startTime

    // Build response object
    const response: SnapshotResponse = {
      snapshot,
      metadata: {
        generatedAt: new Date().toISOString(),
        ttl: 45,
        cacheHit,
      },
    }

    // US-009: Validate full response before sending
    try {
      validateSnapshotResponse(response)
    } catch (error) {
      console.error('[Snapshot API] Response validation failed:', error)
      throw new SnapshotBuildError(
        'Snapshot response failed schema validation',
        error instanceof Error ? error : undefined
      )
    }

    // Return snapshot with metadata
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',
        'Cache-Control': 'max-age=30', // Allow client-side caching for 30s
      },
    })
  } catch (error: unknown) {
    console.error('[Snapshot API] Error:', error)

    const responseTime = Date.now() - startTime

    // Handle ProjectNotFoundError with standardized format
    if (error instanceof ProjectNotFoundError) {
      const standardizedError = notFoundError(error.message, error.message.match(/Project not found: (.+)/)?.[1])
      const response = standardizedError.toNextResponse()
      // Add response time headers
      response.headers.set('X-Response-Time', `${responseTime}ms`)
      response.headers.set('X-Cache-Status', 'ERROR')
      return response
    }

    // Convert other errors to appropriate HTTP response
    const { status, message, retryAfter } = errorToHttpResponse(error)

    const headers: Record<string, string> = {
      'X-Response-Time': `${responseTime}ms`,
      'X-Cache-Status': 'ERROR',
    }

    // Add Retry-After header for 503 responses
    if (status === 503 && retryAfter) {
      headers['Retry-After'] = retryAfter.toString()
    }

    // Use standardized error format for other errors
    const standardizedError = status === 503
      ? internalError(message, { retry_after: retryAfter })
      : internalError(message)

    const response = standardizedError.toNextResponse()

    // Add custom headers
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * OPTIONS /api/internal/snapshot
 *
 * Handle CORS preflight requests for data plane services
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}

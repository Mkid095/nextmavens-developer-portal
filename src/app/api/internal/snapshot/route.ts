/**
 * GET /api/internal/snapshot?project_id=xxx
 *
 * Internal endpoint for data plane services to fetch control plane snapshots.
 * This is the authoritative source of truth for project state.
 *
 * No authentication required (internal endpoint).
 * Snapshots are cached with 45-second TTL for performance.
 *
 * Response time target: < 100ms (achieved via caching)
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildSnapshot } from '@/lib/snapshot/builder'
import { getCachedSnapshot, setCachedSnapshot } from '@/lib/snapshot/cache'
import { SnapshotMetadata } from '@/lib/snapshot/types'

/**
 * Snapshot response with optional metadata
 */
interface SnapshotResponse {
  snapshot?: unknown
  metadata?: SnapshotMetadata
  error?: string
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract project_id from query parameters
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        {
          error: 'Missing project_id parameter',
        } as SnapshotResponse,
        { status: 400 }
      )
    }

    // Validate project_id format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        {
          error: 'Invalid project_id format',
        } as SnapshotResponse,
        { status: 400 }
      )
    }

    // Check cache first
    let cacheHit = false
    let snapshot = getCachedSnapshot(projectId)

    if (snapshot) {
      cacheHit = true
    } else {
      // Build snapshot from database
      snapshot = await buildSnapshot(projectId)

      if (!snapshot) {
        return NextResponse.json(
          {
            error: 'Project not found',
          } as SnapshotResponse,
          { status: 404 }
        )
      }

      // Cache the snapshot (45 second TTL)
      setCachedSnapshot(projectId, snapshot, 45 * 1000)
    }

    const responseTime = Date.now() - startTime

    // Return snapshot with metadata
    return NextResponse.json(
      {
        snapshot,
        metadata: {
          generatedAt: new Date().toISOString(),
          ttl: 45,
          cacheHit,
        },
      } as SnapshotResponse,
      {
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',
          'Cache-Control': 'max-age=30', // Allow client-side caching for 30s
        },
      }
    )
  } catch (error: any) {
    console.error('[Snapshot API] Error:', error)

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate snapshot',
        metadata: {
          generatedAt: new Date().toISOString(),
          ttl: 0,
          cacheHit: false,
        },
      } as SnapshotResponse,
      {
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'ERROR',
        },
      }
    )
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

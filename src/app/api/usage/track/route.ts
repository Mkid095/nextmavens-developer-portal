import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

/**
 * POST /api/usage/track
 *
 * Track usage for quota enforcement.
 * This endpoint is called by data plane services to record resource consumption.
 *
 * Request body:
 * - project_id: UUID - The project using the resource
 * - service: string - The service being used (db_queries, storage_mb, realtime_connections, function_invocations, auth_users)
 * - metric_type: string - Type of metric (db_query, storage_upload, realtime_message, function_call, auth_signup)
 * - amount: number - The amount of resource consumed
 * - request_id: string (optional) - Unique request identifier for idempotency
 *
 * Returns:
 * - tracked: boolean - Whether the usage was tracked
 * - id: string - The usage snapshot ID
 *
 * Idempotent: Duplicate requests with the same request_id are ignored.
 *
 * US-004: Implement Usage Tracking
 */

// Valid services from quotas table constraint
const VALID_SERVICES = [
  'db_queries',
  'storage_mb',
  'realtime_connections',
  'function_invocations',
  'auth_users',
] as const

// Valid metric types from usage_snapshots table constraint
const VALID_METRIC_TYPES = [
  'db_query',
  'storage_upload',
  'realtime_message',
  'function_call',
  'auth_signup',
] as const

type Service = typeof VALID_SERVICES[number]
type MetricType = typeof VALID_METRIC_TYPES[number]

interface TrackRequest {
  project_id: string
  service: string
  metric_type: string
  amount: number
  request_id?: string
}

interface TrackResponse {
  tracked: boolean
  id: string
  message?: string
}

/**
 * Validate the request body
 */
function validateRequest(body: TrackRequest): { valid: boolean; error?: string } {
  if (!body.project_id || typeof body.project_id !== 'string') {
    return { valid: false, error: 'project_id is required and must be a string' }
  }

  if (!body.service || typeof body.service !== 'string') {
    return { valid: false, error: 'service is required and must be a string' }
  }

  if (!VALID_SERVICES.includes(body.service as Service)) {
    return {
      valid: false,
      error: `Invalid service. Must be one of: ${VALID_SERVICES.join(', ')}`,
    }
  }

  if (!body.metric_type || typeof body.metric_type !== 'string') {
    return { valid: false, error: 'metric_type is required and must be a string' }
  }

  if (!VALID_METRIC_TYPES.includes(body.metric_type as MetricType)) {
    return {
      valid: false,
      error: `Invalid metric_type. Must be one of: ${VALID_METRIC_TYPES.join(', ')}`,
    }
  }

  if (typeof body.amount !== 'number' || body.amount < 0) {
    return { valid: false, error: 'amount is required and must be a non-negative number' }
  }

  if (body.request_id !== undefined && typeof body.request_id !== 'string') {
    return { valid: false, error: 'request_id must be a string if provided' }
  }

  return { valid: true }
}

/**
 * Check if a request_id has already been tracked (idempotency)
 */
async function isRequestAlreadyTracked(
  pool: any,
  requestId: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM control_plane.usage_snapshots
        WHERE id = $1
      )
      `,
      [requestId]
    )

    return result.rows[0].exists
  } catch (error) {
    console.error('[Usage Track] Error checking request_id:', error)
    return false
  }
}

/**
 * POST handler for usage tracking
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TrackRequest

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { project_id, service, metric_type, amount, request_id } = body
    const pool = getPool()

    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [project_id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check for idempotency if request_id is provided
    if (request_id) {
      const alreadyTracked = await isRequestAlreadyTracked(pool, request_id)
      if (alreadyTracked) {
        // Return success with existing ID (idempotent)
        return NextResponse.json({
          tracked: false,
          id: request_id,
          message: 'Usage already tracked (duplicate request)',
        } as TrackResponse)
      }
    }

    // Generate a unique ID for this usage snapshot
    const snapshotId = request_id || crypto.randomUUID()

    // Insert usage snapshot
    await pool.query(
      `
      INSERT INTO control_plane.usage_snapshots (
        id,
        project_id,
        service,
        metric_type,
        amount,
        recorded_at,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), NOW()
      )
      `,
      [snapshotId, project_id, service, metric_type, amount]
    )

    return NextResponse.json({
      tracked: true,
      id: snapshotId,
    } as TrackResponse)
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string }
    console.error('[Usage Track] Error:', error)

    // Handle unique constraint violation (shouldn't happen with idempotency check, but just in case)
    if (err.code === '23505') {
      return NextResponse.json({
        tracked: false,
        id: body.request_id || 'unknown',
        message: 'Usage already tracked (duplicate request)',
      } as TrackResponse)
    }

    return NextResponse.json(
      { error: err.message || 'Failed to track usage' },
      { status: 500 }
    )
  }
}

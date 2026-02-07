import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Valid services
const VALID_SERVICES = [
  'db_queries',
  'storage_mb',
  'realtime_connections',
  'function_invocations',
  'auth_users',
] as const

type Service = typeof VALID_SERVICES[number]

// Request schema
interface TrackUsageRequest {
  project_id: string
  service: string
  metric_type?: string
  amount: number
  recorded_at?: string
  metadata?: Record<string, any>
}

// Response schema
interface TrackUsageResponse {
  id: string
  project_id: string
  service: string
  metric_type: string | null
  amount: number
  recorded_at: string
}

/**
 * Validate the request body
 */
function validateRequest(body: TrackUsageRequest): { valid: boolean; error?: string } {
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

  if (typeof body.amount !== 'number' || body.amount < 0) {
    return { valid: false, error: 'amount is required and must be a non-negative number' }
  }

  return { valid: true }
}

/**
 * Check if project is active (not suspended)
 */
async function isProjectActive(pool: any, projectId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `
      SELECT status
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      return false
    }

    return result.rows[0].status === 'active'
  } catch (error) {
    console.error('[Usage Track] Error checking project status:', error)
    return false
  }
}

// POST /v1/usage/track - Record usage for a project
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return errorResponse(
        'VALIDATION_ERROR',
        validation.error || 'Invalid request',
        400
      )
    }

    const { project_id, service, metric_type, amount, recorded_at, metadata } = body
    const pool = getPool()

    // Check if project exists and user has access
    const projectCheck = await pool.query(
      'SELECT id, developer_id, organization_id, status FROM projects WHERE id = $1',
      [project_id]
    )

    if (projectCheck.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    const project = projectCheck.rows[0]

    // Personal project: check if user is the owner
    if (!project.organization_id) {
      if (String(project.developer_id) !== String(developer.id)) {
        return errorResponse('FORBIDDEN', 'Access denied to this project', 403)
      }
    } else {
      // Organization project: check if user is a member
      const membershipCheck = await pool.query(
        `SELECT 1 FROM control_plane.organization_members
         WHERE org_id = $1 AND user_id = $2 AND status = 'accepted'
         LIMIT 1`,
        [project.organization_id, developer.id]
      )

      if (membershipCheck.rows.length === 0) {
        return errorResponse('FORBIDDEN', 'Access denied to this project', 403)
      }
    }

    // Check if project is active
    if (project.status !== 'active') {
      return errorResponse(
        'PROJECT_INACTIVE',
        `Project is ${project.status}. Cannot record usage.`,
        403
      )
    }

    // Record usage to usage_metrics table
    const recordedAt = recorded_at ? new Date(recorded_at) : new Date()

    const result = await pool.query(
      `
      INSERT INTO control_plane.usage_metrics
      (project_id, service, metric_type, quantity, recorded_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, service, metric_type, quantity, recorded_at
      `,
      [
        project_id,
        service,
        metric_type || null,
        amount,
        recordedAt,
        metadata ? JSON.stringify(metadata) : null,
      ]
    )

    const usageRecord = result.rows[0]

    const response: TrackUsageResponse = {
      id: usageRecord.id,
      project_id: usageRecord.project_id,
      service: usageRecord.service,
      metric_type: usageRecord.metric_type,
      amount: usageRecord.quantity,
      recorded_at: usageRecord.recorded_at.toISOString(),
    }

    // Also record to usage_snapshots for quota checking
    // This is a simplified approach - in production, you'd batch these
    try {
      const startOfMonth = new Date(recordedAt.getFullYear(), recordedAt.getMonth(), 1)

      await pool.query(
        `
        INSERT INTO control_plane.usage_snapshots
        (project_id, service, amount, recorded_at, period)
        VALUES ($1, $2, $3, $4, 'month')
        ON CONFLICT (project_id, service, period, recorded_at)
        DO UPDATE SET amount = usage_snapshots.amount + $3
        `,
        [project_id, service, amount, recordedAt]
      )
    } catch (snapshotError) {
      console.error('[Usage Track] Warning: Failed to update usage snapshot:', snapshotError)
      // Don't fail the request if snapshot update fails
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Usage Track API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to record usage', 500)
  }
}

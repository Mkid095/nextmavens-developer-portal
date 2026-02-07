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
interface CheckUsageRequest {
  project_id: string
  service: string
  amount: number
}

// Response schema
interface CheckUsageResponse {
  allowed: boolean
  usage_percentage: number
  reset_at: string
  current_usage: number
  monthly_limit: number
  hard_cap: number
  reason?: string
}

/**
 * Validate the request body
 */
function validateRequest(body: CheckUsageRequest): { valid: boolean; error?: string } {
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
 * Get current usage for a project and service from usage_snapshots
 */
async function getCurrentUsage(
  pool: any,
  projectId: string,
  service: string
): Promise<number> {
  try {
    // Get the start of the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Aggregate usage from snapshots for this month
    const result = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) as total_usage
      FROM control_plane.usage_snapshots
      WHERE project_id = $1
        AND service = $2
        AND recorded_at >= $3
      `,
      [projectId, service, startOfMonth]
    )

    return parseFloat(result.rows[0].total_usage) || 0
  } catch (error) {
    console.error('[Usage Check] Error getting current usage:', error)
    return 0
  }
}

/**
 * Get quota configuration for a project and service
 */
async function getQuotaConfig(
  pool: any,
  projectId: string,
  service: string
): Promise<{ monthly_limit: number; hard_cap: number; reset_at: string } | null> {
  try {
    const result = await pool.query(
      `
      SELECT monthly_limit, hard_cap, reset_at
      FROM control_plane.quotas
      WHERE project_id = $1 AND service = $2
      `,
      [projectId, service]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('[Usage Check] Error getting quota config:', error)
    return null
  }
}

/**
 * Check if project is suspended
 */
async function isProjectSuspended(pool: any, projectId: string): Promise<boolean> {
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

    return result.rows[0].status === 'suspended'
  } catch (error) {
    console.error('[Usage Check] Error checking project status:', error)
    return false
  }
}

// POST /v1/usage/check - Check if an operation is within quota limits
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

    const { project_id, service, amount } = body
    const pool = getPool()

    // Check if project exists and user has access
    const projectCheck = await pool.query(
      'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
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

    // Get quota configuration
    const quotaConfig = await getQuotaConfig(pool, project_id, service)
    if (!quotaConfig) {
      // No quota configured - deny by default
      return errorResponse(
        'SERVICE_DISABLED',
        'No quota configured for this service',
        503
      )
    }

    // Get current usage
    const currentUsage = await getCurrentUsage(pool, project_id, service)

    // Check if project is suspended
    const suspended = await isProjectSuspended(pool, project_id)
    if (suspended) {
      return errorResponse(
        'PROJECT_SUSPENDED',
        'Project is suspended. Contact support for assistance.',
        403
      )
    }

    // Calculate projected usage
    const projectedUsage = currentUsage + amount

    // Check hard cap (abuse prevention)
    if (quotaConfig.hard_cap > 0 && projectedUsage > quotaConfig.hard_cap) {
      return errorResponse(
        'QUOTA_EXCEEDED',
        `Hard cap exceeded. Current: ${currentUsage}, Hard cap: ${quotaConfig.hard_cap}`,
        429
      )
    }

    // Check monthly limit (soft quota)
    const usagePercentage =
      quotaConfig.monthly_limit > 0
        ? (projectedUsage / quotaConfig.monthly_limit) * 100
        : 0

    // If over 100% of monthly limit, still allow but with warning
    // Hard cap is the real enforcement boundary
    const allowed = projectedUsage <= quotaConfig.hard_cap || quotaConfig.hard_cap === 0

    const response: CheckUsageResponse = {
      allowed,
      usage_percentage: Math.round(usagePercentage * 100) / 100,
      reset_at: quotaConfig.reset_at,
      current_usage: currentUsage,
      monthly_limit: quotaConfig.monthly_limit,
      hard_cap: quotaConfig.hard_cap,
    }

    // If approaching hard cap (>90%), add reason
    if (quotaConfig.hard_cap > 0 && usagePercentage > 90) {
      response.reason = 'approaching_hard_cap'
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
    console.error('[Usage Check API] Error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to check quota limits', 500)
  }
}

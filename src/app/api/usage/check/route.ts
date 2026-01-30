import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { toErrorNextResponse, ErrorCode, isPlatformError, createError } from '@/lib/errors'

/**
 * POST /api/usage/check
 *
 * Check if an operation is within quota limits.
 * This endpoint is called by data plane services to enforce quotas.
 *
 * Request body:
 * - project_id: UUID - The project to check
 * - service: string - The service being used (db_queries, storage_mb, realtime_connections, function_invocations, auth_users)
 * - amount: number - The amount of resource being consumed
 *
 * Returns:
 * - allowed: boolean - Whether the operation is allowed
 * - usage_percentage: number - Current usage as percentage of monthly limit
 * - reset_at: string - When the quota resets
 *
 * Error responses:
 * - 429: Over rate limit (too many requests)
 * - 403: Over hard cap (project suspended)
 *
 * US-003: Create Quota Checking API
 */

// Valid services from quotas table constraint
const VALID_SERVICES = [
  'db_queries',
  'storage_mb',
  'realtime_connections',
  'function_invocations',
  'auth_users',
] as const

type Service = typeof VALID_SERVICES[number]

interface CheckRequest {
  project_id: string
  service: string
  amount: number
}

interface CheckResponse {
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
function validateRequest(body: CheckRequest): { valid: boolean; error?: string } {
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

/**
 * POST handler for usage checking
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckRequest

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return toErrorNextResponse(
        { code: ErrorCode.VALIDATION_ERROR, message: validation.error || 'Invalid request' }
      )
    }

    const { project_id, service, amount } = body
    const pool = getPool()

    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [project_id]
    )

    if (projectCheck.rows.length === 0) {
      return toErrorNextResponse(
        { code: ErrorCode.NOT_FOUND, message: 'Project not found' }
      )
    }

    // Check if project is suspended
    const suspended = await isProjectSuspended(pool, project_id)
    if (suspended) {
      return toErrorNextResponse(
        createError(
          ErrorCode.PROJECT_SUSPENDED,
          'Project temporarily suspended due to excessive usage',
          project_id
        )
      )
    }

    // Get quota configuration
    const quotaConfig = await getQuotaConfig(pool, project_id, service)
    if (!quotaConfig) {
      // No quota configured - deny by default
      return toErrorNextResponse(
        { code: ErrorCode.SERVICE_DISABLED, message: 'No quota configured for this service' }
      )
    }

    // Get current usage
    const currentUsage = await getCurrentUsage(pool, project_id, service)
    const projectedUsage = currentUsage + amount

    // Check hard cap (abuse prevention)
    if (quotaConfig.hard_cap > 0 && projectedUsage > quotaConfig.hard_cap) {
      return toErrorNextResponse(
        createError(
          ErrorCode.QUOTA_EXCEEDED,
          'Quota exceeded: hard cap reached',
          project_id,
          {
            current_usage: currentUsage,
            hard_cap: quotaConfig.hard_cap,
            reset_at: quotaConfig.reset_at,
          }
        )
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

    const response: CheckResponse = {
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

    return NextResponse.json(response)
  } catch (error: unknown) {
    if (isPlatformError(error)) {
      return error.toNextResponse()
    }
    console.error('[Usage Check] Error:', error)
    return toErrorNextResponse(error)
  }
}

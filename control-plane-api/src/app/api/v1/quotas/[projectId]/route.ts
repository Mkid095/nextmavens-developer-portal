import { NextRequest, NextResponse } from 'next/server'
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

// Quota configuration schema
interface QuotaConfig {
  service: string
  monthly_limit: number
  hard_cap: number
  reset_at: string
  created_at: string
  updated_at: string
}

// Update quota request schema
interface UpdateQuotaRequest {
  service: string
  monthly_limit: number
  hard_cap: number
}

/**
 * Validate the service
 */
function validateService(service: string): { valid: boolean; error?: string } {
  if (!service || typeof service !== 'string') {
    return { valid: false, error: 'service is required and must be a string' }
  }

  if (!VALID_SERVICES.includes(service as Service)) {
    return {
      valid: false,
      error: `Invalid service. Must be one of: ${VALID_SERVICES.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Validate quota values
 */
function validateQuotaValues(monthlyLimit: number, hardCap: number): { valid: boolean; error?: string } {
  if (typeof monthlyLimit !== 'number' || monthlyLimit < 0) {
    return { valid: false, error: 'monthly_limit must be a non-negative number' }
  }

  if (typeof hardCap !== 'number' || hardCap < 0) {
    return { valid: false, error: 'hard_cap must be a non-negative number' }
  }

  if (hardCap > 0 && monthlyLimit > hardCap) {
    return { valid: false, error: 'monthly_limit cannot be greater than hard_cap' }
  }

  return { valid: true }
}

/**
 * Get default quota configuration for a service
 */
function getDefaultQuota(service: string): { monthly_limit: number; hard_cap: number } {
  const defaults: Record<string, { monthly_limit: number; hard_cap: number }> = {
    db_queries: { monthly_limit: 1000000, hard_cap: 2000000 },
    storage_mb: { monthly_limit: 5000, hard_cap: 10000 },
    realtime_connections: { monthly_limit: 100, hard_cap: 200 },
    function_invocations: { monthly_limit: 100000, hard_cap: 200000 },
    auth_users: { monthly_limit: 1000, hard_cap: 2000 },
  }

  return defaults[service] || { monthly_limit: 0, hard_cap: 0 }
}

/**
 * Get next reset date (start of next month)
 */
function getNextResetDate(): Date {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

// GET /v1/quotas/:projectId - Get all quotas for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const developer = await authenticateRequest(req)
    const { projectId } = await params

    const pool = getPool()

    // Check if project exists and user has access
    const projectCheck = await pool.query(
      'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
      [projectId]
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

    // Get all quotas for the project
    const result = await pool.query(
      `
      SELECT service, monthly_limit, hard_cap, reset_at, created_at, updated_at
      FROM control_plane.quotas
      WHERE project_id = $1
      ORDER BY service
      `,
      [projectId]
    )

    const quotas: QuotaConfig[] = result.rows.map(row => ({
      service: row.service,
      monthly_limit: row.monthly_limit,
      hard_cap: row.hard_cap,
      reset_at: row.reset_at.toISOString(),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }))

    // For any services not configured, add defaults
    const configuredServices = new Set(quotas.map(q => q.service))
    for (const service of VALID_SERVICES) {
      if (!configuredServices.has(service)) {
        const defaultQuota = getDefaultQuota(service)
        quotas.push({
          service,
          monthly_limit: defaultQuota.monthly_limit,
          hard_cap: defaultQuota.hard_cap,
          reset_at: getNextResetDate().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        quotas,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Quotas API] GET error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get quotas', 500)
  }
}

// PUT /v1/quotas/:projectId - Update a specific quota for a project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const developer = await authenticateRequest(req)
    const { projectId } = await params
    const body = await req.json()
    const { service, monthly_limit, hard_cap } = body

    // Validate service
    const serviceValidation = validateService(service)
    if (!serviceValidation.valid) {
      return errorResponse('VALIDATION_ERROR', serviceValidation.error || 'Invalid service', 400)
    }

    // Validate quota values
    const quotaValidation = validateQuotaValues(monthly_limit, hard_cap)
    if (!quotaValidation.valid) {
      return errorResponse('VALIDATION_ERROR', quotaValidation.error || 'Invalid quota values', 400)
    }

    const pool = getPool()

    // Check if project exists and user has access
    const projectCheck = await pool.query(
      'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
      [projectId]
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

    // Upsert the quota configuration
    const resetAt = getNextResetDate()

    const result = await pool.query(
      `
      INSERT INTO control_plane.quotas
      (project_id, service, monthly_limit, hard_cap, reset_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (project_id, service)
      DO UPDATE SET
        monthly_limit = EXCLUDED.monthly_limit,
        hard_cap = EXCLUDED.hard_cap,
        reset_at = EXCLUDED.reset_at,
        updated_at = NOW()
      RETURNING project_id, service, monthly_limit, hard_cap, reset_at, created_at, updated_at
      `,
      [projectId, service, monthly_limit, hard_cap, resetAt]
    )

    const quota = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        project_id: quota.project_id,
        service: quota.service,
        monthly_limit: quota.monthly_limit,
        hard_cap: quota.hard_cap,
        reset_at: quota.reset_at.toISOString(),
        created_at: quota.created_at.toISOString(),
        updated_at: quota.updated_at.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Quotas API] PUT error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update quota', 500)
  }
}

// DELETE /v1/quotas/:projectId - Reset a specific quota or all quotas to defaults
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const developer = await authenticateRequest(req)
    const { projectId } = await params

    const pool = getPool()

    // Check if project exists and user has access
    const projectCheck = await pool.query(
      'SELECT id, developer_id, organization_id FROM projects WHERE id = $1',
      [projectId]
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

    // Check if we're deleting a specific quota or all quotas
    const searchParams = req.nextUrl.searchParams
    const service = searchParams.get('service')

    if (service) {
      // Validate service
      const serviceValidation = validateService(service)
      if (!serviceValidation.valid) {
        return errorResponse('VALIDATION_ERROR', serviceValidation.error || 'Invalid service', 400)
      }

      // Delete specific quota
      await pool.query(
        'DELETE FROM control_plane.quotas WHERE project_id = $1 AND service = $2',
        [projectId, service]
      )

      return NextResponse.json({
        success: true,
        message: `Quota for ${service} deleted. Will use default value.`,
      })
    } else {
      // Delete all quotas
      const result = await pool.query(
        'DELETE FROM control_plane.quotas WHERE project_id = $1',
        [projectId]
      )

      return NextResponse.json({
        success: true,
        message: `All quotas reset to defaults (${result.rowCount} quotas deleted)`,
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Quotas API] DELETE error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete quota', 500)
  }
}

/**
 * POST /api/support/request
 *
 * Create a support request with auto-attached context.
 *
 * Request body:
 * - project_id: UUID - The project ID
 * - subject: string - Subject/title of the support request
 * - description: string - Detailed description of the issue
 *
 * Returns:
 * - request_id: UUID - The created support request ID
 * - status: string - Initial status (always 'open')
 *
 * Auto-attached context:
 * - project_id, project_name, project_status
 * - recent errors (last 10)
 * - current usage metrics
 * - logs snippet (last 20 lines)
 *
 * US-002: Create Support Request API
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getPool } from '@/lib/db'
import { sendSupportRequestNotification } from '@/lib/support-notifications'

interface SupportRequestRequest {
  project_id: string
  subject: string
  description: string
}

interface SupportRequestResponse {
  request_id: string
  status: string
}

/**
 * Validate the request body
 */
function validateRequest(body: SupportRequestRequest): {
  valid: boolean
  error?: string
} {
  if (!body.project_id || typeof body.project_id !== 'string') {
    return { valid: false, error: 'project_id is required and must be a string' }
  }

  if (!body.subject || typeof body.subject !== 'string' || body.subject.length < 3 || body.subject.length > 500) {
    return { valid: false, error: 'subject is required and must be between 3 and 500 characters' }
  }

  if (!body.description || typeof body.description !== 'string' || body.description.length < 10) {
    return { valid: false, error: 'description is required and must be at least 10 characters' }
  }

  return { valid: true }
}

/**
 * Get project information for context
 */
async function getProjectInfo(pool: any, projectId: string, developerId: string) {
  const result = await pool.query(
    `SELECT p.id, p.project_name, p.status, t.slug as tenant_slug
     FROM projects p
     JOIN tenants t ON p.tenant_id = t.id
     WHERE p.id = $1 AND p.developer_id = $2`,
    [projectId, developerId]
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

/**
 * Get recent errors for context (last 10 error-level logs)
 */
async function getRecentErrors(pool: any, projectId: string) {
  const result = await pool.query(
    `SELECT id, timestamp, service, message, metadata, request_id
     FROM control_plane.project_logs
     WHERE project_id = $1 AND level = 'error'
     ORDER BY timestamp DESC
     LIMIT 10`,
    [projectId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp,
    service: row.service,
    message: row.message,
    metadata: row.metadata,
    request_id: row.request_id,
  }))
}

/**
 * Get current usage metrics for context
 */
async function getCurrentUsageMetrics(pool: any, projectId: string) {
  const result = await pool.query(
    `SELECT service, monthly_limit, hard_cap, reset_at
     FROM control_plane.quotas
     WHERE project_id = $1`,
    [projectId]
  )

  const quotas = result.rows

  // Get current usage for each service
  const usage: Record<string, any> = {}

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  for (const quota of quotas) {
    const usageResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_usage
       FROM control_plane.usage_snapshots
       WHERE project_id = $1 AND service = $2 AND recorded_at >= $3`,
      [projectId, quota.service, startOfMonth]
    )

    const currentUsage = parseFloat(usageResult.rows[0].total_usage) || 0
    const usagePercentage = quota.monthly_limit > 0 ? (currentUsage / quota.monthly_limit) * 100 : 0

    usage[quota.service] = {
      current_usage: currentUsage,
      monthly_limit: quota.monthly_limit,
      hard_cap: quota.hard_cap,
      usage_percentage: Math.round(usagePercentage * 100) / 100,
      reset_at: quota.reset_at,
    }
  }

  return usage
}

/**
 * Get logs snippet for context (last 20 lines)
 */
async function getLogsSnippet(pool: any, projectId: string) {
  const result = await pool.query(
    `SELECT id, timestamp, service, level, message, request_id
     FROM control_plane.project_logs
     WHERE project_id = $1
     ORDER BY timestamp DESC
     LIMIT 20`,
    [projectId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp,
    service: row.service,
    level: row.level,
    message: row.message,
    request_id: row.request_id,
  }))
}

/**
 * POST handler for creating support requests
 */
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = (await req.json()) as SupportRequestRequest

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { project_id, subject, description } = body
    const pool = getPool()

    // Get project information and verify ownership
    const projectInfo = await getProjectInfo(pool, project_id, developer.id)
    if (!projectInfo) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Auto-attach context
    const context = {
      project: {
        id: projectInfo.id,
        name: projectInfo.project_name,
        status: projectInfo.status,
        tenant_slug: projectInfo.tenant_slug,
      },
      recent_errors: await getRecentErrors(pool, project_id),
      usage_metrics: await getCurrentUsageMetrics(pool, project_id),
      logs_snippet: await getLogsSnippet(pool, project_id),
    }

    // Create support request
    const result = await pool.query(
      `INSERT INTO control_plane.support_requests
         (project_id, user_id, subject, description, context, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING id, status`,
      [project_id, developer.id, subject, description, JSON.stringify(context)]
    )

    const supportRequest = result.rows[0]

    const response: SupportRequestResponse = {
      request_id: supportRequest.id,
      status: supportRequest.status,
    }

    // US-009: Send notification email when support request is created
    // Fire and forget - don't block the response on email delivery
    sendSupportRequestNotification(supportRequest.id, 'created').catch(err => {
      console.error('[Support Request] Failed to send notification email:', err)
    })

    return NextResponse.json(response, { status: 201 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Support Request] Error creating support request:', error)
    return NextResponse.json(
      {
        error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to create support request. Please try again later.'
      },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

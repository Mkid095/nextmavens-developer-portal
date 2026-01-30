import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  extractClientIP,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import { getPool } from '@/lib/db'

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/abuse/dashboard/approaching-caps
 * Get projects approaching their caps (usage > 80%)
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 */
export async function GET(req: NextRequest) {
  const clientIP = extractClientIP(req)

  try {
    const developer = await authenticateRequest(req)
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    const rateLimitIdentifier: RateLimitIdentifier = {
      type: RateLimitIdentifierType.ORG,
      value: authorizedDeveloper.id,
    }

    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      10,
      60 * 60 * 1000
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retry_after: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    const pool = getPool()

    // Get all active projects with their quotas
    const result = await pool.query(
      `
      SELECT DISTINCT
        q.project_id,
        p.name as project_name,
        p.organization,
        p.status,
        d.email as developer_email,
        q.cap_type,
        q.cap_value,
        q.updated_at
      FROM quotas q
      JOIN projects p ON q.project_id = p.id
      JOIN developers d ON p.developer_id = d.id
      WHERE p.status = 'active'
      ORDER BY q.project_id, q.cap_type
      `
    )

    // Group by project and calculate mock usage percentages
    // In production, this would query actual usage metrics
    const projectMap = new Map<string, {
      project_id: string
      project_name: string
      organization: string
      developer_email: string
      caps: Array<{
        cap_type: string
        cap_value: number
        usage_percentage: number
        status: 'ok' | 'warning' | 'critical'
      }>
    }>()

    for (const row of result.rows) {
      const projectId = row.project_id

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          project_id: projectId,
          project_name: row.project_name,
          organization: row.organization,
          developer_email: row.developer_email,
          caps: [],
        })
      }

      // In production, calculate actual usage from metrics tables
      // For now, using mock data
      const mockUsage = Math.floor(Math.random() * parseInt(row.cap_value))
      const usagePercentage = Math.floor((mockUsage / parseInt(row.cap_value)) * 100)

      let status: 'ok' | 'warning' | 'critical' = 'ok'
      if (usagePercentage >= 90) {
        status = 'critical'
      } else if (usagePercentage >= 80) {
        status = 'warning'
      }

      const project = projectMap.get(projectId)!
      project.caps.push({
        cap_type: row.cap_type,
        cap_value: parseInt(row.cap_value),
        usage_percentage: usagePercentage,
        status,
      })
    }

    // Filter to only projects with caps approaching limits
    const approachingProjects = Array.from(projectMap.values())
      .filter((project) =>
        project.caps.some((cap) => cap.usage_percentage >= 80)
      )
      .sort((a, b) => {
        const aMaxUsage = Math.max(...a.caps.map((c) => c.usage_percentage))
        const bMaxUsage = Math.max(...b.caps.map((c) => c.usage_percentage))
        return bMaxUsage - aMaxUsage
      })

    // Calculate statistics
    const totalProjects = projectMap.size
    const approachingCount = approachingProjects.length
    const criticalCount = approachingProjects.filter((p) =>
      p.caps.some((c) => c.status === 'critical')
    ).length

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            total_projects: totalProjects,
            approaching_count: approachingCount,
            critical_count: criticalCount,
          },
          projects: approachingProjects,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Approaching Caps API] Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    if (
      errorMessage === 'No token provided' ||
      errorMessage === 'Invalid token'
    ) {
      await logAuthFailure(
        null,
        'approaching_caps_dashboard',
        errorMessage,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      const authError = error as { developerId?: string }
      await logAuthFailure(
        authError.developerId || null,
        'approaching_caps_dashboard',
        error.message,
        undefined,
        clientIP
      )
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode?: number }).statusCode || 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch approaching caps data',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

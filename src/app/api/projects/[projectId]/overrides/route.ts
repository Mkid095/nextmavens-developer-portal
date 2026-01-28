import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin, AuthorizationError } from '@/features/abuse-controls/lib/authorization'
import {
  performManualOverride,
  getOverrideHistory,
} from '@/features/abuse-controls/lib/manual-overrides'
import { ManualOverrideAction } from '@/features/abuse-controls/types'
import { projectIdSchema, manualOverrideRequestSchema } from '@/features/abuse-controls/lib/validation'
import {
  logAuthFailure,
  logValidationFailure,
  logManualIntervention,
  extractClientIP,
  extractUserAgent,
  logRateLimitExceeded,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import { ZodError, z } from 'zod'

/**
 * POST /api/projects/[projectId]/overrides
 * Perform a manual override on a project
 *
 * Allows operators/admins to:
 * - Unsuspend a suspended project
 * - Increase hard caps for a project
 * - Both unsuspend and increase caps
 *
 * SECURITY: Requires operator or admin role.
 * Rate limited to prevent abuse.
 * All actions are logged to audit.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Validate project ID
    const projectIdValidation = projectIdSchema.safeParse(projectId)
    if (!projectIdValidation.success) {
      await logValidationFailure(
        'manual_override',
        'Invalid project ID',
        { projectId, errors: projectIdValidation.error.issues }
      )
      return NextResponse.json(
        {
          error: 'Invalid project ID',
          details: projectIdValidation.error.issues,
        },
        { status: 400 }
      )
    }

    // Require operator or admin role
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    // Apply rate limiting: 10 requests per hour per operator
    const rateLimitIdentifier: RateLimitIdentifier = {
      type: RateLimitIdentifierType.ORG,
      value: authorizedDeveloper.id,
    }

    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      10, // 10 requests
      60 * 60 * 1000 // 1 hour window
    )

    if (!rateLimitResult.allowed) {
      await logRateLimitExceeded(
        authorizedDeveloper.id,
        'manual_override',
        10,
        clientIP
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many manual override requests. Please try again later.',
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

    // Verify project exists
    const pool = require('@/lib/db').getPool()
    const projectResult = await pool.query(
      'SELECT id, project_name FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    let validatedData: z.infer<typeof manualOverrideRequestSchema>

    try {
      validatedData = await manualOverrideRequestSchema.parseAsync(body)
    } catch (error) {
      if (error instanceof ZodError) {
        await logValidationFailure(
          'manual_override',
          'Invalid request body',
          { projectId, errors: error.issues }
        )
        return NextResponse.json(
          {
            error: 'Invalid request body',
            details: error.issues,
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Perform the manual override
    const result = await performManualOverride(
      {
        projectId,
        action: validatedData.action as ManualOverrideAction,
        reason: validatedData.reason,
        newCaps: validatedData.newCaps,
        notes: validatedData.notes,
      },
      authorizedDeveloper.id,
      clientIP
    )

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to perform manual override',
          details: result.error,
        },
        { status: 500 }
      )
    }

    // Log the manual intervention
    await logManualIntervention(
      projectId,
      authorizedDeveloper.id,
      `Manual override: ${validatedData.action}`,
      {
        action: validatedData.action,
        reason: validatedData.reason,
        notes: validatedData.notes,
        previous_status: result.previousState.previousStatus,
        new_status: result.currentState.status,
        previous_caps: result.previousState.previousCaps,
        new_caps: result.currentState.caps,
        ip_address: clientIP,
        user_agent: userAgent,
      }
    )

    console.log(
      `[Overrides API] Manual ${validatedData.action} performed on project ${projectId} by ${authorizedDeveloper.email}`
    )

    return NextResponse.json(
      {
        message: 'Manual override performed successfully',
        result: {
          override_record: {
            id: result.overrideRecord.id,
            project_id: result.overrideRecord.project_id,
            action: result.overrideRecord.action,
            reason: result.overrideRecord.reason,
            notes: result.overrideRecord.notes,
            performed_by: result.overrideRecord.performed_by,
            performed_at: result.overrideRecord.performed_at,
          },
          previous_state: {
            status: result.previousState.previousStatus,
            caps: result.previousState.previousCaps,
            was_suspended: result.previousState.wasSuspended,
          },
          current_state: {
            status: result.currentState.status,
            caps: result.currentState.caps,
          },
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('[Overrides API] Manual override error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'Error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_override',
        errorMessage,
        params.projectId,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Log authorization failures
    if (errorName === 'AuthorizationError') {
      const authError = error as Error & { developerId?: string; statusCode?: number }
      await logAuthFailure(
        authError.developerId || null,
        'manual_override',
        errorMessage,
        params.projectId,
        clientIP
      )
      return NextResponse.json(
        { error: errorMessage },
        { status: authError.statusCode || 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to perform manual override',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/projects/[projectId]/overrides
 * Get override history for a project
 *
 * Returns the history of manual overrides performed on a project.
 * Only accessible by the project owner or operators/admins.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Validate project ID
    const projectIdValidation = projectIdSchema.safeParse(projectId)
    if (!projectIdValidation.success) {
      await logValidationFailure(
        'get_override_history',
        'Invalid project ID',
        { projectId, errors: projectIdValidation.error.issues }
      )
      return NextResponse.json(
        {
          error: 'Invalid project ID',
          details: projectIdValidation.error.issues,
        },
        { status: 400 }
      )
    }

    // Verify project exists
    const pool = require('@/lib/db').getPool()
    const projectResult = await pool.query(
      'SELECT id, developer_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]

    // Check authorization: project owner or operator/admin
    const isOwner = project.developer_id === developer.id
    let isOperatorOrAdmin = false

    try {
      await requireOperatorOrAdmin(developer)
      isOperatorOrAdmin = true
    } catch {
      // Not an operator/admin, that's ok if they're the owner
    }

    if (!isOwner && !isOperatorOrAdmin) {
      await logAuthFailure(
        developer.id,
        'get_override_history',
        'Access denied',
        projectId,
        clientIP
      )
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

    // Get override history
    const overrides = await getOverrideHistory(projectId, limit)

    return NextResponse.json({
      project_id: projectId,
      count: overrides.length,
      overrides: overrides.map((override) => ({
        id: override.id,
        action: override.action,
        reason: override.reason,
        notes: override.notes,
        previous_status: override.previous_status,
        new_status: override.new_status,
        previous_caps: override.previous_caps,
        new_caps: override.new_caps,
        performed_by: override.performed_by,
        performed_at: override.performed_at,
      })),
    })
  } catch (error: unknown) {
    console.error('[Overrides API] Get override history error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'get_override_history',
        errorMessage,
        params.projectId,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to get override history',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

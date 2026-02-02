/**
 * Project Overrides API - POST Handler
 *
 * POST /api/projects/[projectId]/overrides
 *
 * Perform a manual override on a project.
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

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  performManualOverride,
} from '@/features/abuse-controls/lib/manual-overrides'
import { ManualOverrideAction } from '@/features/abuse-controls/types'
import { manualOverrideRequestSchema } from '@/features/abuse-controls/lib/validation'
import {
  logManualIntervention,
  logRateLimitExceeded,
} from '@/features/abuse-controls/lib/audit-logger'
import {
  checkRateLimit,
  RateLimitIdentifier,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter'
import { ZodError } from 'zod'
import { validateProjectId, handleAuthError, getRequestContext } from './utils'
import type { ManualOverrideResult } from './types'

export async function handlePostOverride(
  req: NextRequest,
  params: { projectId: string }
): Promise<NextResponse> {
  const { clientIP, userAgent } = getRequestContext(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Validate project ID
    const validationError = await validateProjectId(projectId, 'manual_override', clientIP)
    if (validationError) return validationError

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
        await (await import('@/features/abuse-controls/lib/audit-logger')).then(({ logValidationFailure }) =>
          logValidationFailure(
            'manual_override',
            'Invalid request body',
            { projectId, errors: error.issues }
          )
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
        } as ManualOverrideResult,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('[Overrides API] Manual override error:', error)

    // Handle auth errors
    const authError = await handleAuthError(error, 'manual_override', params.projectId, clientIP)
    if (authError) return authError

    return NextResponse.json(
      {
        error: 'Failed to perform manual override',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

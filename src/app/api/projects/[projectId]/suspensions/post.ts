/**
 * Suspensions API POST Handler
 *
 * Manually suspend a project (for operators/admins)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { HardCapType } from '@/features/abuse-controls/types'
import type { SuspensionReason } from '@/features/abuse-controls/types'
import { projectIdSchema, manualSuspensionSchema } from '@/features/abuse-controls/lib/validation'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  logValidationFailure,
  extractClientIP,
  extractUserAgent,
} from '@/features/abuse-controls/lib/audit-logger'
import { logProjectAction, ActorType } from '@nextmavenspacks/audit-logs-database'
import { ZodError, z } from 'zod'

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
        'manual_suspend',
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

    // Require operator or admin role for manual suspension
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    // Verify project exists
    const pool = getPool()
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

    // Parse and validate request body
    const body = await req.json()
    let validatedData: z.infer<typeof manualSuspensionSchema>

    try {
      validatedData = manualSuspensionSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        await logValidationFailure(
          'manual_suspend',
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

    // Check if project is already suspended
    const existingSuspension = await SuspensionManager.getStatus(projectId)
    if (existingSuspension) {
      return NextResponse.json(
        {
          error: 'Project is already suspended',
          suspension: {
            id: existingSuspension.id,
            cap_exceeded: existingSuspension.cap_exceeded,
            suspended_at: existingSuspension.suspended_at,
          },
        },
        { status: 409 }
      )
    }

    // Create suspension reason
    const reason: SuspensionReason = {
      cap_type: validatedData.cap_type,
      current_value: validatedData.current_value,
      limit_exceeded: validatedData.limit_exceeded,
      details: validatedData.details,
    }

    // Suspend the project
    await SuspensionManager.suspend(
      projectId,
      reason,
      validatedData.notes || 'Manual suspension'
    )

    // Log the suspension action to audit logs
    await logProjectAction.suspended(
      { id: authorizedDeveloper.id, type: ActorType.USER },
      projectId,
      `Manual suspension: ${reason.cap_type} exceeded`,
      {
        request: {
          ip: clientIP,
          userAgent,
        },
        metadata: {
          cap_type: reason.cap_type,
          current_value: reason.current_value,
          limit_exceeded: reason.limit_exceeded,
        },
      }
    )

    // Get the suspension record
    const suspension = await SuspensionManager.getStatus(projectId)

    return NextResponse.json(
      {
        message: 'Project suspended successfully',
        suspension: {
          id: suspension?.id,
          cap_exceeded: suspension?.cap_exceeded,
          reason: suspension?.reason,
          suspended_at: suspension?.suspended_at,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('[Suspensions API] Suspend project error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'Error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_suspend',
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
      const authError = error as any & { developerId?: string; statusCode?: number }
      await logAuthFailure(
        authError.developerId || null,
        'manual_suspend',
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
      { error: 'Failed to suspend project' },
      { status: 500 }
    )
  }
}

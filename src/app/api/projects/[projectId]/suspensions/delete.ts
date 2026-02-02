/**
 * Suspensions API DELETE Handler
 *
 * Unsuspend a project (operators/admins only)
 *
 * SECURITY: Project owners CANNOT unsuspend their own projects.
 * This prevents abuse where users could immediately unsuspend after
 * hitting hard caps, defeating the purpose of auto-suspension.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { projectIdSchema, manualUnsuspensionSchema } from '@/features/abuse-controls/lib/validation'
import { requireOperatorOrAdmin, preventOwnerUnsuspend } from '@/features/abuse-controls/lib/authorization'
import {
  logAuthFailure,
  logValidationFailure,
  extractClientIP,
  extractUserAgent,
} from '@/features/abuse-controls/lib/audit-logger'
import { logProjectAction, ActorType } from '@nextmavenspacks/audit-logs-database'
import type { AuthorizationError } from '@/features/abuse-controls/lib/authorization'

export async function DELETE(
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
        'manual_unsuspend',
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

    // Require operator or admin role for manual unsuspension
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    // CRITICAL: Prevent project owners from unsuspending their own projects
    await preventOwnerUnsuspend(developer.id, projectId)

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

    // Check if project is suspended
    const existingSuspension = await SuspensionManager.getStatus(projectId)
    if (!existingSuspension) {
      return NextResponse.json(
        { error: 'Project is not suspended' },
        { status: 409 }
      )
    }

    // Parse and validate request body for notes
    let notes: string | undefined
    try {
      const body = await req.json()
      const validation = manualUnsuspensionSchema.safeParse(body)
      if (validation.success) {
        notes = validation.data.notes
      }
    } catch {
      // No body or invalid JSON - use default notes
    }

    // Unsuspend the project
    await SuspensionManager.unsuspend(
      projectId,
      notes || 'Manual unsuspension'
    )

    // Log the unsuspension action to audit logs
    await logProjectAction.updated(
      { id: authorizedDeveloper.id, type: ActorType.USER },
      projectId,
      { action: 'unsuspended', reason: notes || 'Manual unsuspension' },
      {
        request: {
          ip: clientIP,
          userAgent,
        },
        metadata: {
          previous_suspension: existingSuspension.reason,
        },
      }
    )

    return NextResponse.json({
      message: 'Project unsuspended successfully',
      project_id: projectId,
    })
  } catch (error: unknown) {
    console.error('[Suspensions API] Unsuspend project error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : 'Error'

    // Log authentication failures
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      await logAuthFailure(
        null,
        'manual_unsuspend',
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
      const authError = error as AuthorizationError & { developerId?: string; statusCode?: number }
      await logAuthFailure(
        authError.developerId || null,
        'manual_unsuspend',
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
      { error: 'Failed to unsuspend project' },
      { status: 500 }
    )
  }
}

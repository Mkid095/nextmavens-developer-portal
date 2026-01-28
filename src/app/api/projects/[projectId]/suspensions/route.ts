import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { SuspensionManager, ProjectSuspendedError } from '@/features/abuse-controls/lib/data-layer'
import { HardCapType } from '@/features/abuse-controls/types'
import type { SuspensionReason } from '@/features/abuse-controls/types'
import { projectIdSchema, manualSuspensionSchema, manualUnsuspensionSchema } from '@/features/abuse-controls/lib/validation'
import { requireOperatorOrAdmin, preventOwnerUnsuspend, AuthorizationError } from '@/features/abuse-controls/lib/authorization'
import {
  logSuspension,
  logUnsuspension,
  logAuthFailure,
  logValidationFailure,
  extractClientIP,
  extractUserAgent,
} from '@/features/abuse-controls/lib/audit-logger'
import { ZodError, z } from 'zod'

/**
 * GET /api/projects/[projectId]/suspensions
 * Get current suspension status for a project
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
    const validationResult = projectIdSchema.safeParse(projectId)
    if (!validationResult.success) {
      await logValidationFailure(
        'get_suspension_status',
        'Invalid project ID',
        { projectId, errors: validationResult.error.issues }
      )
      return NextResponse.json(
        {
          error: 'Invalid project ID',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    // Verify project belongs to the developer
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

    const project = projectResult.rows[0]
    if (project.developer_id !== developer.id) {
      await logAuthFailure(
        developer.id,
        'get_suspension_status',
        'Project access denied',
        projectId,
        clientIP
      )
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get suspension status
    const suspension = await SuspensionManager.getStatus(projectId)

    if (!suspension) {
      return NextResponse.json({
        suspended: false,
        message: 'Project is not suspended',
      })
    }

    return NextResponse.json({
      suspended: true,
      suspension: {
        id: suspension.id,
        cap_exceeded: suspension.cap_exceeded,
        reason: suspension.reason,
        suspended_at: suspension.suspended_at,
        notes: suspension.notes,
      },
    })
  } catch (error: any) {
    console.error('[Suspensions API] Get suspension status error:', error)

    // Log authentication failures
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      await logAuthFailure(
        null,
        'get_suspension_status',
        error.message,
        params.projectId,
        clientIP
      )
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get suspension status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/suspensions
 * Manually suspend a project (for operators/admins)
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

    // Log the suspension action
    await logSuspension(
      projectId,
      authorizedDeveloper.id,
      `Manual suspension: ${reason.cap_type} exceeded`,
      {
        cap_type: reason.cap_type,
        current_value: reason.current_value,
        limit_exceeded: reason.limit_exceeded,
        ip_address: clientIP,
        user_agent: userAgent,
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
      const authError = error as AuthorizationError & { developerId?: string }
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

/**
 * DELETE /api/projects/[projectId]/suspensions
 * Unsuspend a project (operators/admins only)
 *
 * SECURITY: Project owners CANNOT unsuspend their own projects.
 * This prevents abuse where users could immediately unsuspend after
 * hitting hard caps, defeating the purpose of auto-suspension.
 */
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

    // Log the unsuspension action
    await logUnsuspension(
      projectId,
      authorizedDeveloper.id,
      'Manual unsuspension by operator/admin',
      {
        previous_suspension: existingSuspension.reason,
        ip_address: clientIP,
        user_agent: userAgent,
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
      const authError = error as AuthorizationError & { developerId?: string }
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

/**
 * PATCH /api/projects/[projectId]/feature-flags/[flagName]
 * DELETE /api/projects/[projectId]/feature-flags/[flagName]
 *
 * Manage a specific project-level feature flag
 *
 * US-011: Support Project-Level Flags
 *
 * - PATCH: Update a project-specific feature flag
 * - DELETE: Remove a project-specific flag (reverts to global flag)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { setFeatureFlag, deleteFeatureFlag } from '@/lib/features'
import { getPool } from '@/lib/db'

interface UpdateFlagRequest {
  enabled: boolean
  metadata?: Record<string, unknown>
}

/**
 * PATCH /api/projects/[projectId]/feature-flags/[flagName]
 *
 * Update a project-specific feature flag
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; flagName: string } }
) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    const projectId = params.projectId
    const flagName = params.flagName

    // Verify the user has access to this project
    const pool = getPool()
    const projectCheck = await pool.query(
      'SELECT id FROM control_plane.projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Parse request body
    const body: UpdateFlagRequest = await req.json()

    // Validate enabled field
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: 'enabled field must be a boolean',
        },
        { status: 400 }
      )
    }

    // Set project-specific feature flag
    const oldValue = await setFeatureFlag(
      flagName,
      body.enabled,
      'project',
      projectId,
      body.metadata || {}
    )

    return NextResponse.json({
      success: true,
      flag: {
        name: flagName,
        enabled: body.enabled,
        scope: 'project',
        scope_id: projectId,
        oldValue,
      },
    })
  } catch (error: unknown) {
    console.error('[Project Feature Flags] Error updating flag:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to update feature flag'

    // Handle authentication errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update feature flag',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]/feature-flags/[flagName]
 *
 * Delete a project-specific flag, reverting to the global flag value
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; flagName: string } }
) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    const projectId = params.projectId
    const flagName = params.flagName

    // Verify the user has access to this project
    const pool = getPool()
    const projectCheck = await pool.query(
      'SELECT id FROM control_plane.projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Delete the project-specific flag
    const deleted = await deleteFeatureFlag(flagName, 'project', projectId)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Flag not found',
          code: 'NOT_FOUND',
          details: `No project-specific flag found for "${flagName}"`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Project-specific flag removed, now using global flag value',
      flag: {
        name: flagName,
        scope: 'project',
        scope_id: projectId,
      },
    })
  } catch (error: unknown) {
    console.error('[Project Feature Flags] Error deleting flag:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete feature flag'

    // Handle authentication errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete feature flag',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

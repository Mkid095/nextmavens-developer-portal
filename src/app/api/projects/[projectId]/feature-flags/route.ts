/**
 * GET /api/projects/[projectId]/feature-flags
 * POST /api/projects/[projectId]/feature-flags
 *
 * Manage project-specific feature flags
 *
 * US-011: Support Project-Level Flags
 *
 * - GET: Lists all feature flags for a project (project-specific flags override global flags)
 * - POST: Creates or updates a project-specific feature flag
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getProjectFeatureFlags, setFeatureFlag, deleteFeatureFlag } from '@/lib/features'
import { getPool } from '@/lib/db'

interface CreateFlagRequest {
  name: string
  enabled: boolean
  metadata?: Record<string, unknown>
}

/**
 * GET /api/projects/[projectId]/feature-flags
 *
 * Get all feature flags for a specific project
 * Returns both project-specific flags and global flags
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    const projectId = params.projectId

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

    // Get feature flags for this project (project flags override global flags)
    const flags = await getProjectFeatureFlags(projectId)

    return NextResponse.json({
      success: true,
      flags,
      projectId,
    })
  } catch (error: unknown) {
    console.error('[Project Feature Flags] Error fetching flags:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch feature flags'

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
        error: 'Failed to fetch feature flags',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/feature-flags
 *
 * Create or update a project-specific feature flag
 *
 * Project flags override global flags for this specific project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    const projectId = params.projectId

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
    const body: CreateFlagRequest = await req.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: 'name field is required and must be a string',
        },
        { status: 400 }
      )
    }

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
      body.name,
      body.enabled,
      'project',
      projectId,
      body.metadata || {}
    )

    return NextResponse.json({
      success: true,
      flag: {
        name: body.name,
        enabled: body.enabled,
        scope: 'project',
        scope_id: projectId,
        oldValue,
      },
    })
  } catch (error: unknown) {
    console.error('[Project Feature Flags] Error creating flag:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to create feature flag'

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
        error: 'Failed to create feature flag',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

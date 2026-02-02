/**
 * Force Delete Route - HTTP Handlers
 *
 * POST /api/admin/projects/[id]/force
 * GET /api/admin/projects/[id]/force
 * DELETE /api/admin/projects/[id]/force
 *
 * US-006: Implement Force Delete Power
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateBreakGlassToken,
  extractTokenFromBody,
} from '@/features/break-glass/lib/middleware'
import {
  forceDeleteProject,
  validateForceDeleteRequest,
} from '@/features/break-glass/lib/force-delete-project.service'
import type { ForceDeleteProjectError, ForceDeleteHistoryResponse } from './types'
import {
  validateRequestParams,
  createAuthError,
  createTokenRequiredError,
} from './validation'
import { parseError, createErrorResponse, getErrorCode } from './errors'

/**
 * POST /api/admin/projects/[id]/force
 *
 * Force delete a project immediately using break glass power.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Step 1: Parse request body
    let body: Partial<{ reason?: string; cleanup_resources?: boolean }> = {}
    try {
      body = await req.json()
    } catch {
      // Body is optional, continue with empty object
    }

    // Step 2: Extract and validate break glass token
    let token = extractTokenFromBody(body as { break_glass_token?: string })

    // If not in body, try headers/query params
    if (!token) {
      const tokenValidation = await validateBreakGlassToken(req)
      if (!tokenValidation.valid) {
        return NextResponse.json(createAuthError(tokenValidation.reason), { status: 401 })
      }
      token = tokenValidation.session?.id ?? null
    }

    if (!token) {
      return NextResponse.json(createTokenRequiredError(), { status: 401 })
    }

    // Step 3: Validate the token
    const tokenValidation = await validateBreakGlassToken(req, token)
    if (!tokenValidation.valid) {
      return NextResponse.json(createAuthError(tokenValidation.reason), { status: 401 })
    }

    const adminId = tokenValidation.admin_id as string
    const sessionId = tokenValidation.session?.id as string

    // Step 4: Validate request parameters
    const validation = validateRequestParams(projectId, sessionId, adminId)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Step 5: Perform force delete operation
    const result = await forceDeleteProject({
      projectId,
      sessionId,
      adminId,
      reason: body.reason,
      cleanupResources: body.cleanup_resources !== false, // Default true
    })

    // Step 6: Return success response
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    console.error('[Force Delete Project API] Error:', error)

    const { errorResponse, errorMessage } = parseError(error)
    const response = errorResponse ?? createErrorResponse(errorMessage)

    return NextResponse.json(response, {
      status: errorResponse ? getErrorCode(errorResponse.code) : 500,
    })
  }
}

/**
 * GET /api/admin/projects/[id]/force
 *
 * Get force delete history for a project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Validate break glass token
    const tokenValidation = await validateBreakGlassToken(req)
    if (!tokenValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid or expired break glass token',
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        },
        { status: 401 }
      )
    }

    // Import getForceDeleteHistory dynamically to avoid circular dependency
    const { getForceDeleteHistory } = await import('@/features/break-glass/lib/force-delete-project.service')

    // Get force delete history
    const history = await getForceDeleteHistory(projectId)

    return NextResponse.json({
      project_id: projectId,
      force_delete_count: history.length,
      force_deletes: history,
    })
  } catch (error: unknown) {
    console.error('[Force Delete Project API] Get history error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to get force delete history',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/projects/[id]/force
 *
 * Alternative method for force delete using DELETE HTTP method.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Extract reason from query params
    const url = new URL(req.url)
    const reason = url.searchParams.get('reason') || undefined
    const cleanupResources = url.searchParams.get('cleanup_resources') !== 'false'

    // Validate break glass token from headers
    const tokenValidation = await validateBreakGlassToken(req)
    if (!tokenValidation.valid) {
      return NextResponse.json(createAuthError(tokenValidation.reason), { status: 401 })
    }

    const adminId = tokenValidation.admin_id as string
    const sessionId = tokenValidation.session?.id as string

    // Validate request parameters
    const validation = validateRequestParams(projectId, sessionId, adminId)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Perform force delete operation
    const result = await forceDeleteProject({
      projectId,
      sessionId,
      adminId,
      reason,
      cleanupResources,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    console.error('[Force Delete Project API] Error:', error)

    const { errorResponse, errorMessage } = parseError(error)
    const response = errorResponse ?? createErrorResponse(errorMessage)

    return NextResponse.json(response, {
      status: errorResponse ? getErrorCode(response.code) : 500,
    })
  }
}

/**
 * Project Overrides API - GET Handler
 *
 * GET /api/projects/[projectId]/overrides
 *
 * Get override history for a project.
 *
 * Returns the history of manual overrides performed on a project.
 * Only accessible by the project owner or operators/admins.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { getOverrideHistory } from '@/features/abuse-controls/lib/manual-overrides'
import { validateProjectId, handleAuthError, getRequestContext } from './utils'
import { logAuthFailure } from '@/features/abuse-controls/lib/audit-logger'
import type { OverrideHistoryResponse } from './types'

export async function handleGetOverrides(
  req: NextRequest,
  params: { projectId: string }
): Promise<NextResponse> {
  const { clientIP } = getRequestContext(req)

  try {
    const developer = await authenticateRequest(req)
    const projectId = params.projectId

    // Validate project ID
    const validationError = await validateProjectId(projectId, 'get_override_history', clientIP)
    if (validationError) return validationError

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
    } as OverrideHistoryResponse)
  } catch (error: unknown) {
    console.error('[Overrides API] Get override history error:', error)

    // Handle auth errors
    const authError = await handleAuthError(error, 'get_override_history', params.projectId, clientIP)
    if (authError) return authError

    return NextResponse.json(
      {
        error: 'Failed to get override history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

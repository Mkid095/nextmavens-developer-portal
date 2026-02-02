/**
 * Suspensions API GET Handler
 *
 * Get current suspension status for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { projectIdSchema } from '@/features/abuse-controls/lib/validation'
import { logAuthFailure, logValidationFailure, extractClientIP } from '@/features/abuse-controls/lib/audit-logger'
import type { SuspensionStatusResponse } from './types'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const clientIP = extractClientIP(req)

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

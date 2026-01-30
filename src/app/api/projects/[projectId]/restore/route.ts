import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'

/**
 * POST /api/projects/[projectId]/restore
 * Restore a soft-deleted project during grace period
 *
 * - Clears deletion columns (deletion_scheduled_at, grace_period_ends_at)
 * - Sets status back to ACTIVE
 * - Works only if grace_period_ends_at > NOW()
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const correlationId = withCorrelationId(req)

  try {
    await authenticateRequest(req)
    const projectId = params.projectId
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to restore project
    const response = await controlPlane.restoreProject(projectId, req)

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Restore Project API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

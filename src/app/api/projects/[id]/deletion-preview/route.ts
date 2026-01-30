import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import type { DeletionPreviewResponse } from '@/lib/types/deletion-preview.types'

/**
 * GET /api/projects/[id]/deletion-preview
 * Get a preview of what will be deleted when a project is deleted
 *
 * Returns:
 * - Project details
 * - Counts of resources to be deleted
 * - Dependencies and their impacts
 * - Recoverable until date
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = withCorrelationId(req)

  try {
    await authenticateRequest(req)
    const projectId = params.id
    const controlPlane = getControlPlaneClient()

    // Get deletion preview from Control Plane API
    const preview = await controlPlane.getDeletionPreview(projectId, req)

    const res = NextResponse.json(preview)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Deletion Preview API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deletion preview' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

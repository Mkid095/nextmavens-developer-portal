import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to get organization details
    const response = await controlPlane.getOrganization(params.id, req)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Developer Portal] Get organization error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get organization' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

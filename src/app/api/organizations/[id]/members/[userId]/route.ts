import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import { updateMemberRoleSchema } from '@/lib/validation'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: { role: 'owner' | 'admin' | 'developer' | 'viewer' }
    try {
      validatedData = updateMemberRoleSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to update member role
    const response = await controlPlane.updateOrganizationMemberRole(
      params.id,
      params.userId,
      validatedData,
      req
    )

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('[Developer Portal] Update member role error:', error)

    // Handle specific error codes from control plane
    if (error.code === 'FORBIDDEN') {
      return NextResponse.json(
        { error: error.message || 'Forbidden' },
        { status: 403 }
      )
    }

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: error.message || 'Not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update member role' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to remove member
    const response = await controlPlane.removeOrganizationMember(
      params.id,
      params.userId,
      req
    )

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('[Developer Portal] Remove member error:', error)

    // Handle specific error codes from control plane
    if (error.code === 'FORBIDDEN') {
      return NextResponse.json(
        { error: error.message || 'Forbidden' },
        { status: 403 }
      )
    }

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: error.message || 'Not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

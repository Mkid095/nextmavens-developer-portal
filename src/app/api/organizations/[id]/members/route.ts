import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import { inviteMemberSchema } from '@/lib/validation'

/**
 * GET /api/organizations/[id]/members
 *
 * List all members of an organization including pending invitations.
 * Returns members with their roles and status.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to get organization members
    const response = await controlPlane.listOrganizationMembers(params.id, req)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Developer Portal] List members error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list members' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/organizations/[id]/members
 *
 * Invite a new member to the organization by email.
 * Only owners and admins can invite members.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: { email: string; role: 'owner' | 'admin' | 'developer' | 'viewer' }
    try {
      validatedData = inviteMemberSchema.parse(body)
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

    // Call Control Plane API to invite member
    const response = await controlPlane.inviteOrganizationMember(
      params.id,
      validatedData,
      req
    )

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('[Developer Portal] Invite member error:', error)

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

    if (error.code === 'PENDING_INVITATION' || error.code === 'ALREADY_MEMBER') {
      return NextResponse.json(
        { error: error.message || 'Invitation failed' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to invite member' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

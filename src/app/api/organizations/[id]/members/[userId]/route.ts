import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import { updateMemberRoleSchema } from '@/lib/validation'
import { getPool } from '@/lib/db'

/**
 * GET /api/organizations/[id]/members/[userId]
 *
 * US-009: Get user's role in an organization for client-side permission checking.
 * Returns the member's role if the authenticated user is requesting their own role,
 * or if the user has permission to view organization members.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Check if the requesting user is the member being requested
    const isSelf = developer.id === params.userId

    // If not requesting own role, verify permission to view members
    // (This is a basic check - more sophisticated permission checking could be added)
    if (!isSelf) {
      // For now, only allow users to request their own role
      // This could be extended to allow admins/owners to view other members' roles
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Query the organization_members table to get the user's role
    const result = await pool.query(
      `SELECT org_id, user_id, role, joined_at
       FROM control_plane.organization_members
       WHERE org_id = $1 AND user_id = $2`,
      [params.id, params.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const member = result.rows[0]

    return NextResponse.json({
      member: {
        org_id: member.org_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[Developer Portal] Get member role error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to get member role' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

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

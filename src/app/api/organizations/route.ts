import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'

export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const { name, slug } = body

    // Validation
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 255) {
      return NextResponse.json(
        { error: 'Organization name must be between 2 and 255 characters' },
        { status: 400 }
      )
    }

    // Optional slug validation
    if (slug !== undefined) {
      if (typeof slug !== 'string' || slug.length < 2 || slug.length > 100) {
        return NextResponse.json(
          { error: 'Slug must be between 2 and 100 characters' },
          { status: 400 }
        )
      }
      // Slug must contain only lowercase letters, numbers, and hyphens
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }
    }

    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to create organization
    const response = await controlPlane.createOrganization(
      { name, slug },
      req
    )

    return NextResponse.json(response.data, { status: 201 })
  } catch (error: any) {
    console.error('[Developer Portal] Create organization error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create organization' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Call Control Plane API to list organizations
    const response = await controlPlane.listOrganizations(
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      },
      req
    )

    return NextResponse.json({
      organizations: response.data || [],
      meta: response.meta,
    })
  } catch (error: any) {
    console.error('[Developer Portal] List organizations error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list organizations' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

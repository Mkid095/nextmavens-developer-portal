import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'

interface OrganizationWithStats {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
  member_count: number
  project_count: number
}

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Get organizations list from control plane
    const orgResponse = await controlPlane.listOrganizations({}, req)
    const organizations = orgResponse.data || []

    // For each organization, get member and project counts
    const orgsWithStats: OrganizationWithStats[] = await Promise.all(
      organizations.map(async (org) => {
        // Get organization details which includes members
        const orgDetailResponse = await controlPlane.getOrganization(org.id, req)
        const members = orgDetailResponse.members || []

        // Count members (including owner)
        const memberCount = members.length + 1 // +1 for the owner

        // Get projects for this organization
        // We need to check if there's an API to get projects by organization
        // For now, we'll use the project list API and filter
        // This is a temporary solution - ideally the control plane would provide this directly
        let projectCount = 0

        try {
          // Try to get projects - the projects endpoint should support filtering by organization
          // If not, we'll need to add that to the control plane API
          const projectsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || 'http://localhost:3001'}/api/v1/projects?organization_id=${org.id}`,
            {
              headers: {
                Authorization: req.headers.get('Authorization') || '',
              },
            }
          )

          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            projectCount = projectsData.data?.length || 0
          }
        } catch (e) {
          // If we can't get project count, default to 0
          console.error('Error getting project count:', e)
        }

        return {
          ...org,
          member_count: memberCount,
          project_count: projectCount,
        }
      })
    )

    return NextResponse.json({
      organizations: orgsWithStats,
    })
  } catch (error: any) {
    console.error('[Developer Portal] List organizations with stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list organizations' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

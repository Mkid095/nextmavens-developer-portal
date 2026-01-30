import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requirePermission } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import { Permission } from '@/lib/types/rbac.types'
import { User } from '@/lib/rbac'

/**
 * GET /api/projects/[projectId]
 * Get a single project with suspension status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req)

  try {
    await authenticateRequest(req)
    const projectId = params.projectId
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to get project
    const response = await controlPlane.getProject(projectId, req)

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Projects API] Get project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * PATCH /api/projects/[projectId]
 * Update a project (checks if suspended)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req)

  try {
    await authenticateRequest(req)
    const projectId = params.projectId
    const controlPlane = getControlPlaneClient()

    // Parse request body
    const body = await req.json()
    const { webhook_url, allowed_origins, rate_limit } = body

    // Call Control Plane API to update project
    const response = await controlPlane.updateProject(
      projectId,
      { webhook_url, allowed_origins, rate_limit },
      req
    )

    const res = NextResponse.json({
      message: 'Project updated successfully',
      project: response.project,
    })
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Projects API] Update project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete a project (requires projects.delete permission)
 *
 * US-005: Apply Permissions to Project Deletion
 * Only organization owners can delete projects. Returns 403 for non-owners.
 */
export const DELETE = requirePermission(
  {
    permission: Permission.PROJECTS_DELETE,
    getOrganizationId: async (req: NextRequest) => {
      // Extract project ID from the request
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const projectIdIndex = pathParts.indexOf('projects') + 1
      const projectId = pathParts[projectIdIndex]

      // Get project details to extract tenant_id (organization ID)
      const controlPlane = getControlPlaneClient()
      const projectData = await controlPlane.getProject(projectId, req)

      // Return the tenant_id as the organization ID
      return projectData.project.tenant_id
    }
  },
  async (req: NextRequest, user: User) => {
    // Apply correlation ID to request
    const correlationId = withCorrelationId(req)

    try {
      // Extract project ID from URL
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const projectIdIndex = pathParts.indexOf('projects') + 1
      const projectId = pathParts[projectIdIndex]

      const controlPlane = getControlPlaneClient()

      // Call Control Plane API to delete project
      const response = await controlPlane.deleteProject(projectId, req)

      const res = NextResponse.json({
        message: 'Project deleted successfully',
        project_id: projectId,
      })
      return setCorrelationHeader(res, correlationId)
    } catch (error: any) {
      console.error('[Projects API] Delete project error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete project' },
        { status: error.message === 'No token provided' ? 401 : 500 }
      )
    }
  }
)

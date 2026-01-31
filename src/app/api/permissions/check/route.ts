import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { checkUserPermission } from '@/lib/rbac'
import { Permission } from '@/lib/types/rbac.types'

/**
 * API endpoint to check if the current user has a specific permission
 * for a given organization.
 *
 * US-009: Update UI Based on Permissions
 *
 * This endpoint is used by the client-side usePermissions hook to
 * conditionally show/hide UI elements based on user permissions.
 *
 * @query permission - The permission to check (e.g., "projects.delete")
 * @query organizationId - The organization ID to check permissions for
 *
 * @returns { granted: boolean, role?: string, reason?: string }
 *
 * @example
 * ```bash
 * GET /api/permissions/check?permission=projects.delete&organizationId=org-123
 * Authorization: Bearer <token>
 *
 * # Response:
 * {
 *   "granted": false,
 *   "reason": "User role 'admin' does not have permission 'projects.delete'",
 *   "role": "admin"
 * }
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const { user } = await authenticateRequest(req)

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const permissionParam = searchParams.get('permission')
    const organizationId = searchParams.get('organizationId')

    if (!permissionParam) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required parameter: permission' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required parameter: organizationId' },
        { status: 400 }
      )
    }

    // Validate permission parameter
    if (!Object.values(Permission).includes(permissionParam as Permission)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Invalid permission: ${permissionParam}` },
        { status: 400 }
      )
    }

    // Check user permission
    const result = await checkUserPermission(user, organizationId, permissionParam as Permission)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Permissions API] Error checking permission:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to check permission'
      },
      { status: 500 }
    )
  }
}

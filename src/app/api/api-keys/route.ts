import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { requirePermission } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  withIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { Permission } from '@/lib/types/rbac.types'
import { User } from '@/lib/rbac'

/**
 * Helper function to get organization ID from a project ID.
 * Queries the projects table to extract the tenant_id (organization ID).
 *
 * @param projectId - The project ID
 * @returns The organization ID (tenant_id)
 * @throws Error if project not found
 */
async function getOrganizationIdFromProject(projectId: string): Promise<string> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT tenant_id FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    throw new Error('Project not found')
  }

  return result.rows[0].tenant_id
}

/**
 * Helper function to get organization ID from an API key.
 * Queries the api_keys table to get the developer_id, then gets the project.
 *
 * @param keyId - The API key ID
 * @returns The organization ID (tenant_id)
 * @throws Error if key not found or associated with no project
 */
async function getOrganizationIdFromKey(keyId: string): Promise<string> {
  const pool = getPool()

  // First, get the developer_id from the api_keys table
  const keyResult = await pool.query(
    'SELECT developer_id FROM api_keys WHERE id = $1',
    [keyId]
  )

  if (keyResult.rows.length === 0) {
    throw new Error('API key not found')
  }

  const developerId = keyResult.rows[0].developer_id

  // Then, get a project owned by this developer to extract the organization (tenant_id)
  // For now, we'll use the first project found. In a multi-org setup, this might need adjustment.
  const projectResult = await pool.query(
    'SELECT tenant_id FROM projects WHERE developer_id = $1 LIMIT 1',
    [developerId]
  )

  if (projectResult.rows.length === 0) {
    throw new Error('No project found for this key owner')
  }

  return projectResult.rows[0].tenant_id
}

/**
 * GET /api/api-keys
 *
 * List API keys for the authenticated user.
 * This endpoint does not require special permissions as it only lists keys
 * that belong to the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    await requirePermission(
      {
        permission: Permission.PROJECTS_MANAGE_KEYS,
        getOrganizationId: async () => {
          // For listing keys, we'll use the user's first project's organization
          // In a proper multi-tenant setup, this should filter by the requested organization
          const { getPayload } = await import('@/lib/auth')
          const authHeader = req.headers.get('authorization')
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No token provided')
          }
          const token = authHeader.substring(7)
          const payload = getPayload(token)

          const pool = getPool()
          const result = await pool.query(
            'SELECT tenant_id FROM projects WHERE developer_id = $1 LIMIT 1',
            [payload.userId]
          )

          if (result.rows.length === 0) {
            throw new Error('No project found')
          }

          return result.rows[0].tenant_id
        }
      },
      async (req: NextRequest, user: User) => {
        const controlPlane = getControlPlaneClient()
        const response = await controlPlane.listApiKeys(req)
        return NextResponse.json(response)
      }
    )(req)
  } catch (error: any) {
    console.error('[Developer Portal] Fetch API keys error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 :
                   error.message === 'Forbidden' ? 403 : 500
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch API keys',
        ...(error.message?.includes('permission') && { required_permission: Permission.PROJECTS_MANAGE_KEYS })
      },
      { status }
    )
  }
}

/**
 * POST /api/api-keys
 *
 * Create a new API key.
 * Requires PROJECTS_MANAGE_KEYS permission.
 * Only admins and owners can create keys.
 *
 * US-007: Apply Permissions to Key Management
 */
export const POST = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_KEYS,
    getOrganizationId: async (req: NextRequest) => {
      // Extract projectId from request body
      const body = await req.json().catch(() => ({}))
      const { projectId } = body

      if (!projectId) {
        throw new Error('Project ID is required')
      }

      return getOrganizationIdFromProject(projectId)
    }
  },
  async (req: NextRequest, user: User) => {
    // Re-parse the body since it was consumed in getOrganizationId
    const body = await req.json()
    const { name, projectId, key_type, environment, mcp_access_level, request_id } = body

    // Generate idempotency key: create_key:{request_id}
    const idempotencyKey = getIdempotencyKey('create_key', req.headers, request_id)

    // Execute with idempotency (TTL: 5 minutes = 300 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const controlPlane = getControlPlaneClient()

        // Validation errors should not be cached
        if (!name) {
          return {
            status: 400,
            headers: {},
            body: { error: 'Name is required' }
          }
        }

        // Call Control Plane API to create API key
        try {
          const response = await controlPlane.createApiKey(
            { name, projectId, key_type, environment, mcp_access_level },
            req
          )

          return {
            status: 201,
            headers: {},
            body: response,
          }
        } catch (apiError) {
          // Handle Control Plane API errors
          if (apiError instanceof Error) {
            return {
              status: 500,
              headers: {},
              body: {
                error: 'Failed to create API key',
                message: apiError.message,
              },
            }
          }
          throw apiError
        }
      },
      { ttl: 300 } // 5 minutes TTL
    )

    // Return the response with the appropriate status code and idempotency key header
    return NextResponse.json(result.body, {
      status: result.status,
      headers: {
        'Idempotency-Key': getIdempotencyKeySuffix(returnedKey),
        ...result.headers,
      },
    })
  }
)

/**
 * DELETE /api/api-keys?id={keyId}
 *
 * Revoke an API key immediately by setting its status to 'revoked'.
 * Requires PROJECTS_MANAGE_KEYS permission.
 * Only admins and owners can revoke keys.
 *
 * US-007: Apply Permissions to Key Management
 */
export const DELETE = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_KEYS,
    getOrganizationId: async (req: NextRequest) => {
      // Extract keyId from query parameters
      const { searchParams } = new URL(req.url)
      const keyId = searchParams.get('id')

      if (!keyId) {
        throw new Error('Key ID is required')
      }

      return getOrganizationIdFromKey(keyId)
    }
  },
  async (req: NextRequest, user: User) => {
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    // Generate idempotency key: revoke:{key_id}
    const idempotencyKey = getIdempotencyKey('revoke', req.headers, keyId)

    // Execute with idempotency (TTL: 1 year - effectively permanent since revocation is permanent)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const controlPlane = getControlPlaneClient()

        // Call Control Plane API to revoke API key
        try {
          const response = await controlPlane.revokeApiKey(keyId, req)

          return {
            status: 200,
            headers: {},
            body: response,
          }
        } catch (apiError) {
          // Handle Control Plane API errors
          if (apiError instanceof Error) {
            return {
              status: 500,
              headers: {},
              body: {
                error: 'Failed to revoke API key',
                message: apiError.message,
              },
            }
          }
          throw apiError
        }
      },
      { ttl: 31536000 } // 1 year TTL (revocation is permanent)
    )

    // Return the response with the appropriate status code and idempotency key header
    return NextResponse.json(result.body, {
      status: result.status,
      headers: {
        'Idempotency-Key': getIdempotencyKeySuffix(returnedKey),
        ...result.headers,
      },
    })
  }
)

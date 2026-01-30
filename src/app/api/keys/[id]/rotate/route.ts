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

interface RouteContext {
  params: Promise<{ id: string }>
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
 * POST /api/keys/:id/rotate
 *
 * Rotate an API key by creating a new version and setting the old key to expire in 24 hours.
 * Requires PROJECTS_MANAGE_KEYS permission.
 * Only admins and owners can rotate keys.
 *
 * US-007: Apply Permissions to Key Management
 */
export const POST = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_KEYS,
    getOrganizationId: async (req: NextRequest) => {
      // Extract keyId from URL
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const keyId = pathParts[pathParts.indexOf('keys') + 1]

      if (!keyId) {
        throw new Error('Key ID is required')
      }

      return getOrganizationIdFromKey(keyId)
    }
  },
  async (req: NextRequest, user: User, context: RouteContext) => {
    const params = await context.params
    const keyId = params.id

    // Generate idempotency key: rotate_key:{key_id}
    const idempotencyKey = getIdempotencyKey('rotate_key', req.headers, keyId)

    // Execute with idempotency (TTL: 5 minutes = 300 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const controlPlane = getControlPlaneClient()

        // Call Control Plane API to rotate API key
        try {
          const response = await controlPlane.rotateApiKey(keyId, req)

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
                error: 'Failed to rotate API key',
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

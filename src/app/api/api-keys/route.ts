import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { requirePermission } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  PiaWithIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { Permission } from '@/lib/types/rbac.types'
import { User } from '@/lib/rbac'

/**
 * GET /api/apibcd-keys
 * List API keys (authenticated users can list their own keys)
 */
export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req)
    const controlPlane = getControlPlaneClient()

    // Call Control Plane API to list API keys
    const response = await controlPlane.listApiKeys(req)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Developer Portal] Fetch API keys error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Failed to fetch API keys' }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateRequest(req)
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
  } catch (error: any) {
    console.error('[Developer Portal] Create API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create API key' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authenticateRequest(req)
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    // Validation errors should not be cached
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
  } catch (error: any) {
    console.error('[Developer Portal] Delete API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete API key' }, { status: 401 })
  }
}

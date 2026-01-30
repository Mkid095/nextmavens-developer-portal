import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  withIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/keys/:id/revoke
 *
 * Revoke an API key immediately by setting its status to 'revoked'.
 * This is different from deleting the key - the key record remains
 * but becomes immediately invalid for authentication.
 *
 * US-003: Implement Revoke Key API
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id

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
    console.error('[Revoke API] Revoke API key error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status }
    )
  }
}

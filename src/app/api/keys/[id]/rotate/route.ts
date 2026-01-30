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

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await authenticateRequest(req)
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
  } catch (error: any) {
    console.error('[Developer Portal] Rotate API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to rotate API key' }, { status: 401 })
  }
}

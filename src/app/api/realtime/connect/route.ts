/**
 * Realtime Connection API
 *
 * Handles WebSocket connection establishment for realtime subscriptions.
 * Validates project_id and returns connection metadata with scoped channel format.
 *
 * US-003: Prefix Realtime Channels (prd-resource-isolation.json)
 *
 * POST /api/realtime/connect
 * Body: { token: string }
 * Returns: Connection metadata with allowed channel patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/auth';
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation';
import {
  createRealtimeHandshake,
  generateAllowedChannels,
  RealtimeScopeError,
} from '@/lib/middleware/realtime-scope';

/**
 * POST /api/realtime/connect
 * Establish a realtime WebSocket connection
 *
 * Request body:
 * ```json
 * {
 *   "token": "jwt_access_token"
 * }
 * ```
 *
 * Success response (200):
 * ```json
 * {
 *   "status": "connected",
 *   "connection": {
 *     "project_id": "uuid",
 *     "max_subscriptions": 50,
 *     "channel_format": "project_id:channel_type:identifier"
 *   },
 *   "example_channels": ["uuid:table:users", "uuid:user:presence"]
 * }
 * ```
 *
 * Error response (401):
 * ```json
 * {
 *   "error": "Missing project ID",
 *   "code": "MISSING_PROJECT_ID"
 * }
 * ```
 */
export async function POST(req: NextRequest) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req);

  try {
    // Parse request body
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          error: 'No token provided',
          message: 'JWT token is required for realtime connection',
        },
        { status: 401 }
      );
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      return NextResponse.json(
        {
          error: 'Missing project_id',
          message: 'JWT token must contain project_id claim',
          code: RealtimeScopeError.MISSING_PROJECT_ID,
        },
        { status: 401 }
      );
    }

    // Create handshake response
    const response = createRealtimeHandshake(req, auth);

    return setCorrelationHeader(response, correlationId);
  } catch (error: any) {
    console.error('[Realtime API] Connection error:', error);

    if (error.message === 'Missing project_id claim') {
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: 'JWT token must contain project_id claim',
          code: RealtimeScopeError.MISSING_PROJECT_ID,
        },
        { status: 401 }
      );
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: error.message || 'Token verification failed',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Connection failed',
        message: error.message || 'Failed to establish realtime connection',
      },
      { status: 500 }
    );
  }
}

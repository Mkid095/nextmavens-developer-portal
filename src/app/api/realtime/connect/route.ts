/**
 * Realtime Connection API
 *
 * Handles WebSocket connection establishment for realtime subscriptions.
 * Validates project_id and returns connection metadata with scoped channel format.
 *
 * US-003: Prefix Realtime Channels (prd-resource-isolation.json)
 * US-008: Update Realtime Service Errors to use standardized error format
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
import { trackRealtimeConnection } from '@/lib/usage/realtime-tracking';
import {
  toErrorNextResponse,
  authenticationError,
  validationError,
  permissionDeniedError,
} from '@/lib/errors';

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
 *   "error": {
 *     "code": "AUTHENTICATION_ERROR",
 *     "message": "No token provided",
 *     "docs": "/docs/errors#AUTHENTICATION_ERROR",
 *     "retryable": false,
 *     "timestamp": "2024-01-01T00:00:00.000Z"
 *   }
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
      const error = authenticationError('JWT token is required for realtime connection');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      const error = authenticationError('JWT token must contain project_id claim');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Create handshake response
    const response = createRealtimeHandshake(req, auth);

    // Track the connection (fire and forget - don't await)
    trackRealtimeConnection(auth.project_id);

    return setCorrelationHeader(response, correlationId);
  } catch (error: any) {
    console.error('[Realtime API] Connection error:', error);

    if (error.message === 'Missing project_id claim') {
      const authError = authenticationError('JWT token must contain project_id claim');
      return setCorrelationHeader(authError.toNextResponse(), correlationId);
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const authError = authenticationError(error.message || 'Token verification failed');
      return setCorrelationHeader(authError.toNextResponse(), correlationId);
    }

    return setCorrelationHeader(toErrorNextResponse(error), correlationId);
  }
}

/**
 * Realtime Subscription API
 *
 * Handles channel subscription requests with project scoping validation.
 * Ensures channels are prefixed with project_id and blocks cross-project access.
 *
 * US-003: Prefix Realtime Channels (prd-resource-isolation.json)
 * US-008: Update Realtime Service Errors to use standardized error format
 *
 * POST /api/realtime/subscribe
 * Body: { token: string, channel: string }
 * Returns: Subscription confirmation or 403 for cross-project access
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/auth';
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation';
import {
  handleChannelSubscription,
  addSubscription,
  buildChannelName,
  generateAllowedChannels,
  ChannelType,
} from '@/lib/middleware/realtime-scope';
import { trackRealtimeMessage, trackRealtimeConnection } from '@/lib/usage/realtime-tracking';
import crypto from 'crypto';
import {
  toErrorNextResponse,
  authenticationError,
  validationError,
  permissionDeniedError,
} from '@/lib/errors';

/**
 * POST /api/realtime/subscribe
 * Subscribe to a realtime channel
 *
 * Request body:
 * ```json
 * {
 *   "token": "jwt_access_token",
 *   "channel": "project_id:table:users"
 * }
 * ```
 *
 * Success response (200):
 * ```json
 * {
 *   "status": "subscribed",
 *   "channel": "project_id:table:users",
 *   "channel_type": "table",
 *   "project_id": "uuid",
 *   "subscription_id": "uuid"
 * }
 * ```
 *
 * Error response (403) - Cross-project access:
 * ```json
 * {
 *   "error": {
 *     "code": "PERMISSION_DENIED",
 *     "message": "Cross-project channel access denied",
 *     "docs": "/docs/errors#PERMISSION_DENIED",
 *     "retryable": false,
 *     "timestamp": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 *
 * Error response (400) - Invalid channel format:
 * ```json
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Invalid channel subscription",
 *     "docs": "/docs/errors#VALIDATION_ERROR",
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
    const { token, channel } = body;

    if (!token) {
      const error = authenticationError('JWT token is required for channel subscription');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    if (!channel) {
      const error = validationError('Channel name is required for subscription');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      const error = authenticationError('JWT token must contain project_id claim');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Handle subscription with validation
    const response = handleChannelSubscription(req, channel, auth);

    // If subscription was successful, add to active subscriptions
    if (response.status === 200) {
      const subscriptionId = crypto.randomUUID();
      const subscription = addSubscription(subscriptionId, channel, auth);

      // Track the subscription as a connection (fire and forget)
      trackRealtimeConnection(auth.project_id);

      // Update response with subscription metadata
      const responseData = await response.json();
      responseData.subscription_id = subscriptionId;
      responseData.subscribed_at = subscription.subscribedAt;

      const newResponse = NextResponse.json(responseData, { status: 200 });
      return setCorrelationHeader(newResponse, correlationId);
    }

    return setCorrelationHeader(response, correlationId);
  } catch (error: any) {
    console.error('[Realtime API] Subscription error:', error);

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

/**
 * GET /api/realtime/subscribe?token=xxx
 * Get allowed channels for a project
 *
 * Query parameters:
 * - token: JWT access token
 *
 * Success response (200):
 * ```json
 * {
 *   "project_id": "uuid",
 *   "allowed_channels": [
 *     "uuid:table:users",
 *     "uuid:table:posts",
 *     "uuid:user:presence",
 *     "uuid:presence:room-1",
 *     "uuid:broadcast:updates"
 *   ],
 *   "channel_format": "project_id:channel_type:identifier"
 * }
 * ```
 */
export async function GET(req: NextRequest) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req);

  try {
    // Extract token from query params
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      const error = authenticationError('JWT token is required');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      const error = authenticationError('JWT token must contain project_id claim');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Generate allowed channels
    const allowedChannels = generateAllowedChannels(auth.project_id);

    const response = NextResponse.json({
      project_id: auth.project_id,
      allowed_channels: allowedChannels,
      channel_format: 'project_id:channel_type:identifier',
      examples: {
        table_subscription: buildChannelName(auth.project_id, ChannelType.TABLE, 'users'),
        user_channel: buildChannelName(auth.project_id, ChannelType.USER, 'presence'),
        presence_room: buildChannelName(auth.project_id, ChannelType.PRESENCE, 'room-1'),
        broadcast_topic: buildChannelName(auth.project_id, ChannelType.BROADCAST, 'updates'),
      },
    });

    return setCorrelationHeader(response, correlationId);
  } catch (error: any) {
    console.error('[Realtime API] Get allowed channels error:', error);

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

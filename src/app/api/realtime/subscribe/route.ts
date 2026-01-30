/**
 * Realtime Subscription API
 *
 * Handles channel subscription requests with project scoping validation.
 * Ensures channels are prefixed with project_id and blocks cross-project access.
 *
 * US-003: Prefix Realtime Channels (prd-resource-isolation.json)
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
 *   "error": "Cross-project channel access denied",
 *   "message": "Access to other project channels not permitted",
 *   "code": "CROSS_PROJECT_CHANNEL"
 * }
 * ```
 *
 * Error response (400) - Invalid channel format:
 * ```json
 * {
 *   "error": "Invalid channel subscription",
 *   "message": "Channel must follow format: project_id:channel_type:identifier",
 *   "code": "INVALID_CHANNEL_FORMAT"
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
      return NextResponse.json(
        {
          error: 'No token provided',
          message: 'JWT token is required for channel subscription',
        },
        { status: 401 }
      );
    }

    if (!channel) {
      return NextResponse.json(
        {
          error: 'No channel provided',
          message: 'Channel name is required for subscription',
        },
        { status: 400 }
      );
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      return NextResponse.json(
        {
          error: 'Missing project_id',
          message: 'JWT token must contain project_id claim',
        },
        { status: 401 }
      );
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
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: 'JWT token must contain project_id claim',
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
        error: 'Subscription failed',
        message: error.message || 'Failed to subscribe to channel',
      },
      { status: 500 }
    );
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
      return NextResponse.json(
        {
          error: 'No token provided',
          message: 'JWT token is required',
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
        },
        { status: 401 }
      );
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
      return NextResponse.json(
        {
          error: 'Invalid token',
          message: 'JWT token must contain project_id claim',
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
        error: 'Failed to get allowed channels',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    );
  }
}

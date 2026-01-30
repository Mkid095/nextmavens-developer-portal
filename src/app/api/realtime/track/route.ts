/**
 * Realtime Message Tracking API
 *
 * Tracks realtime message usage for quota enforcement and billing.
 * This endpoint is called by the realtime service to record message consumption.
 *
 * US-003: Track Realtime Usage (prd-usage-tracking.json)
 *
 * POST /api/realtime/track
 * Body: { token: string, message_count: number }
 * Returns: Tracking confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/auth';
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation';
import { trackRealtimeMessages, recordRealtimeMetric } from '@/lib/usage/realtime-tracking';

/**
 * POST /api/realtime/track
 * Track realtime message usage
 *
 * Request body:
 * ```json
 * {
 *   "token": "jwt_access_token",
 *   "message_count": 5
 * }
 * ```
 *
 * Success response (200):
 * ```json
 * {
 *   "tracked": true,
 *   "project_id": "uuid",
 *   "message_count": 5
 * }
 * ```
 *
 * Error response (401):
 * ```json
 * {
 *   "error": "Missing project_id",
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
    const { token, message_count } = body;

    if (!token) {
      return NextResponse.json(
        {
          error: 'No token provided',
          message: 'JWT token is required for message tracking',
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
          code: 'MISSING_PROJECT_ID',
        },
        { status: 401 }
      );
    }

    // Validate message_count
    const count = parseInt(message_count) || 1;
    if (count < 0) {
      return NextResponse.json(
        {
          error: 'Invalid message_count',
          message: 'message_count must be a non-negative number',
        },
        { status: 400 }
      );
    }

    // Track the messages (fire and forget - don't await)
    if (count > 0) {
      trackRealtimeMessages(auth.project_id, count);
    }

    const response = NextResponse.json({
      tracked: true,
      project_id: auth.project_id,
      message_count: count,
    });

    return setCorrelationHeader(response, correlationId);
  } catch (error: any) {
    console.error('[Realtime API] Track error:', error);

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
        error: 'Tracking failed',
        message: error.message || 'Failed to track message usage',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/realtime/track?token=xxx
 * Get realtime usage statistics for a project
 *
 * Query parameters:
 * - token: JWT access token
 * - days: Number of days to look back (default: 30)
 *
 * Success response (200):
 * ```json
 * {
 *   "project_id": "uuid",
 *   "usage": {
 *     "message_count": 1250,
 *     "connection_count": 15,
 *     "breakdown_by_day": [...],
 *     "breakdown_by_hour": [...]
 *   }
 * }
 * ```
 */
export async function GET(req: NextRequest) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req);

  try {
    // Extract token from query params
    const token = req.nextUrl.searchParams.get('token');
    const daysParam = req.nextUrl.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;

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

    // Get usage statistics
    const { getRealtimeUsageStats } = await import('@/lib/usage/realtime-tracking');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await getRealtimeUsageStats(auth.project_id, startDate, endDate);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          error: 'Failed to get usage stats',
          message: result.error || 'Unknown error',
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      project_id: auth.project_id,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days: days,
      },
      usage: {
        message_count: result.data.messageCount,
        connection_count: result.data.connectionCount,
        breakdown_by_day: result.data.breakdownByDay,
        breakdown_by_hour: result.data.breakdownByHour,
      },
    });

    return setCorrelationHeader(response, correlationId);
  } catch (error: any) {
    console.error('[Realtime API] Get usage stats error:', error);

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
        error: 'Failed to get usage stats',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    );
  }
}

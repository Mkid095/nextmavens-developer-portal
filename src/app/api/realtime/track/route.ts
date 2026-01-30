/**
 * Realtime Message Tracking API
 *
 * Tracks realtime message usage for quota enforcement and billing.
 * This endpoint is called by the realtime service to record message consumption.
 *
 * US-003: Track Realtime Usage (prd-usage-tracking.json)
 * US-008: Update Realtime Service Errors to use standardized error format
 *
 * POST /api/realtime/track
 * Body: { token: string, message_count: number }
 * Returns: Tracking confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/auth';
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation';
import { trackRealtimeMessages, recordRealtimeMetric } from '@/lib/usage/realtime-tracking';
import {
  toErrorNextResponse,
  authenticationError,
  validationError,
} from '@/lib/errors';

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
 *   "error": {
 *     "code": "AUTHENTICATION_ERROR",
 *     "message": "Missing project_id",
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
    const { token, message_count } = body;

    if (!token) {
      const error = authenticationError('JWT token is required for message tracking');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      const error = authenticationError('JWT token must contain project_id claim');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Validate message_count
    const count = parseInt(message_count) || 1;
    if (count < 0) {
      const error = validationError('message_count must be a non-negative number');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
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
      const error = authenticationError('JWT token is required');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Verify JWT and extract project_id
    const auth: JwtPayload = verifyAccessToken(token);

    if (!auth.project_id) {
      const error = authenticationError('JWT token must contain project_id claim');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Validate days parameter
    if (days < 1 || days > 365) {
      const error = validationError('days parameter must be between 1 and 365');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
    }

    // Get usage statistics
    const { getRealtimeUsageStats } = await import('@/lib/usage/realtime-tracking');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await getRealtimeUsageStats(auth.project_id, startDate, endDate);

    if (!result.success || !result.data) {
      const error = validationError(result.error || 'Unknown error');
      return setCorrelationHeader(error.toNextResponse(), correlationId);
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

/**
 * Request Traces API Endpoint
 *
 * Provides API endpoints for querying request traces.
 *
 * US-011: Implement Request Tracing
 * - Trace queryable by request_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation';
import {
  getRequestTrace,
  getProjectTraces,
  getTraceStats,
  type RequestTrace,
} from '@/lib/request-tracing';

/**
 * GET /api/traces/:requestId
 *
 * Get a request trace by request ID
 *
 * Returns the complete trace information for a specific request,
 * including services hit and total duration.
 *
 * @param req - Next.js request object
 * @param context - Route parameters including requestId
 * @returns JSON response with trace data or 404 if not found
 *
 * @example
 * ```bash
 * curl -H "Authorization: Bearer <token>" \
 *   https://api.example.com/api/traces/123e4567-e89b-12d3-a456-426614174000
 * ```
 */
export async function GET(
  req: NextRequest,
  context: { params: { requestId: string } }
): Promise<NextResponse> {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req);

  try {
    const { requestId } = context.params;

    // Validate request ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request ID format. Expected UUID.',
        },
        { status: 400 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    // Get the trace from database
    const trace = await getRequestTrace(requestId);

    if (!trace) {
      const response = NextResponse.json(
        {
          error: 'Not Found',
          message: `No trace found for request ID: ${requestId}`,
        },
        { status: 404 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    // Return the trace
    const response = NextResponse.json({
      request_id: trace.request_id,
      project_id: trace.project_id,
      path: trace.path,
      method: trace.method,
      services_hit: trace.services_hit,
      total_duration_ms: trace.total_duration_ms,
      created_at: trace.created_at,
    });
    return setCorrelationHeader(response, correlationId);
  } catch (error) {
    console.error('[RequestTraces API] Error getting trace:', error);
    const response = NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to get trace',
      },
      { status: 500 }
    );
    return setCorrelationHeader(response, correlationId);
  }
}

// Note: Next.js 13+ App Router requires named exports for different HTTP methods
// This file handles /api/traces/[requestId]
// The /api/traces endpoint (without requestId) is in /api/traces/route.ts

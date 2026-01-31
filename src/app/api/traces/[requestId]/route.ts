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

/**
 * GET /api/traces
 *
 * Get request traces for a project (with optional filters)
 *
 * Query parameters:
 * - projectId: Project ID (required)
 * - startDate: ISO date string for filtering by start date (optional)
 * - endDate: ISO date string for filtering by end date (optional)
 * - limit: Maximum number of traces to return (optional, default: 100)
 * - stats: Set to 'true' to return statistics instead of traces (optional)
 *
 * @param req - Next.js request object
 * @returns JSON response with traces or stats
 *
 * @example
 * ```bash
 * # Get traces for a project
 * curl -H "Authorization: Bearer <token>" \
 *   "https://api.example.com/api/traces?projectId=abc123&limit=50"
 *
 * # Get traces from the last hour
 * curl -H "Authorization: Bearer <token>" \
 *   "https://api.example.com/api/traces?projectId=abc123&startDate=2024-01-30T10:00:00Z"
 *
 * # Get statistics
 * curl -H "Authorization: Bearer <token>" \
 *   "https://api.example.com/api/traces?projectId=abc123&stats=true"
 * ```
 */
export async function GET_traces(req: NextRequest): Promise<NextResponse> {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req);

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
    const limitStr = url.searchParams.get('limit');
    const stats = url.searchParams.get('stats') === 'true';

    // Validate required parameters
    if (!projectId) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Missing required parameter: projectId',
        },
        { status: 400 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    // Validate project ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid project ID format. Expected UUID.',
        },
        { status: 400 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    // Parse optional parameters
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid startDate format. Expected ISO date string.',
        },
        { status: 400 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    if (endDate && isNaN(endDate.getTime())) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid endDate format. Expected ISO date string.',
        },
        { status: 400 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    // Validate limit
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 1000)) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid limit. Must be between 1 and 1000.',
        },
        { status: 400 }
      );
      return setCorrelationHeader(response, correlationId);
    }

    // Return statistics if requested
    if (stats) {
      const statsData = await getTraceStats(projectId, {
        startDate,
        endDate,
      });

      const response = NextResponse.json({
        project_id: projectId,
        period: {
          start: startDate?.toISOString() || null,
          end: endDate?.toISOString() || null,
        },
        statistics: {
          total_requests: statsData.total_requests,
          avg_duration_ms: statsData.avg_duration_ms,
          max_duration_ms: statsData.max_duration_ms,
          min_duration_ms: statsData.min_duration_ms,
        },
        top_services: statsData.top_services,
      });
      return setCorrelationHeader(response, correlationId);
    }

    // Get traces
    const traces = await getProjectTraces(projectId, {
      startDate,
      endDate,
      limit,
    });

    const response = NextResponse.json({
      project_id: projectId,
      period: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null,
      },
      count: traces.length,
      traces: traces.map((trace) => ({
        request_id: trace.request_id,
        path: trace.path,
        method: trace.method,
        services_hit: trace.services_hit,
        total_duration_ms: trace.total_duration_ms,
        created_at: trace.created_at,
      })),
    });
    return setCorrelationHeader(response, correlationId);
  } catch (error) {
    console.error('[RequestTraces API] Error getting traces:', error);
    const response = NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to get traces',
      },
      { status: 500 }
    );
    return setCorrelationHeader(response, correlationId);
  }
}

// Note: Next.js 13+ App Router requires named exports for different HTTP methods
// To support both /[requestId]/route.ts and /route.ts, we use a separate file structure
// This file handles /api/traces/[requestId]
// The /api/traces endpoint (without requestId) should be in a separate file

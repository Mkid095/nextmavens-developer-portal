/**
 * Request Trace by ID API
 *
 * US-011: Implement Request Tracing
 *
 * GET /api/v1/traces/[requestId]
 *
 * Get a specific request trace by request ID.
 *
 * @example
 * ```bash
 * curl "/api/v1/traces/550e8400-e29b-41d4-a716-446655440000"
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestTrace } from '@/lib/request-tracing';

/**
 * GET /api/v1/traces/[requestId]
 *
 * Get a specific request trace by request ID.
 *
 * Path Parameters:
 * - requestId: The UUID of the request trace
 *
 * @returns The request trace or 404 if not found
 *
 * @example
 * ```bash
 * curl "/api/v1/traces/550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST_ID',
            message: 'Invalid request ID format. Must be a valid UUID.',
          },
        },
        { status: 400 }
      );
    }

    const trace = await getRequestTrace(requestId);

    if (!trace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TRACE_NOT_FOUND',
            message: `No trace found for request_id: ${requestId}`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        request_id: trace.request_id,
        project_id: trace.project_id,
        path: trace.path,
        method: trace.method,
        services_hit: trace.services_hit || [],
        total_duration_ms: trace.total_duration_ms,
        created_at: trace.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('[RequestTraces API] Error getting trace:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get request trace',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/v1/traces/[requestId]
 *
 * Check if a request trace exists without returning the full data.
 *
 * @returns 200 if trace exists, 404 if not found
 */
export async function HEAD(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const trace = await getRequestTrace(requestId);

    if (!trace) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[RequestTraces API] Error checking trace:', error);
    return new NextResponse(null, { status: 500 });
  }
}

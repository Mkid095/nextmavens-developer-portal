/**
 * Request Traces API
 *
 * US-011: Implement Request Tracing
 *
 * Provides endpoints to query request traces for debugging and monitoring.
 *
 * Endpoints:
 * - GET /api/v1/traces - List traces with filtering
 * - GET /api/v1/traces/[requestId] - Get specific trace by ID
 *
 * @example
 * ```typescript
 * // Get all traces for a project
 * const response = await fetch('/api/v1/traces?project_id=xxx');
 * const traces = await response.json();
 *
 * // Get specific trace
 * const trace = await fetch('/api/v1/traces/uuid-here').then(r => r.json());
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestTrace, getProjectTraces, type RequestTrace } from '@/lib/request-tracing';
import { z } from 'zod';

/**
 * Query parameters schema for listing traces
 */
const listTracesQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  request_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * GET /api/v1/traces
 *
 * List request traces with optional filtering.
 *
 * Query Parameters:
 * - project_id: Filter by project ID (UUID)
 * - request_id: Filter by specific request ID (UUID)
 * - start_date: Filter traces created after this date (ISO 8601)
 * - end_date: Filter traces created before this date (ISO 8601)
 * - limit: Maximum number of results to return (default: 100, max: 1000)
 * - offset: Number of results to skip (default: 0)
 *
 * @returns List of request traces with pagination info
 *
 * @example
 * ```bash
 * # Get recent traces for a project
 * curl "/api/v1/traces?project_id=xxx&limit=50"
 *
 * # Get traces from the last hour
 * curl "/api/v1/traces?start_date=2024-01-01T00:00:00Z"
 *
 * # Get specific trace
 * curl "/api/v1/traces?request_id=uuid-here"
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const validatedParams = listTracesQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Invalid query parameters',
            details: validatedParams.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const params = validatedParams.data;

    // If request_id is specified, get that specific trace
    if (params.request_id) {
      const trace = await getRequestTrace(params.request_id);

      if (!trace) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TRACE_NOT_FOUND',
              message: `No trace found for request_id: ${params.request_id}`,
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: formatTrace(trace),
        meta: {
          total: 1,
          limit: 1,
          offset: 0,
        },
      });
    }

    // If project_id is specified, get traces for that project
    if (params.project_id) {
      const startDate = params.start_date ? new Date(params.start_date) : undefined;
      const endDate = params.end_date ? new Date(params.end_date) : undefined;

      const traces = await getProjectTraces(params.project_id, {
        startDate,
        endDate,
        limit: params.limit,
      });

      // Apply offset manually (offset not supported by getProjectTraces)
      const offsetTraces = traces.slice(params.offset, params.offset + params.limit);

      return NextResponse.json({
        success: true,
        data: offsetTraces.map(formatTrace),
        meta: {
          total: traces.length,
          limit: params.limit,
          offset: params.offset,
          has_more: params.offset + params.limit < traces.length,
        },
      });
    }

    // If neither request_id nor project_id specified, return error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_FILTER',
          message: 'Either project_id or request_id must be specified',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[RequestTraces API] Error listing traces:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list request traces',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Format a trace for API response
 */
function formatTrace(trace: RequestTrace) {
  return {
    request_id: trace.request_id,
    project_id: trace.project_id,
    path: trace.path,
    method: trace.method,
    services_hit: trace.services_hit || [],
    total_duration_ms: trace.total_duration_ms,
    created_at: trace.created_at.toISOString(),
  };
}

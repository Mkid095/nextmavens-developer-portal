/**
 * Request Tracing Demo Endpoint
 *
 * Demonstrates the use of request tracing middleware.
 * This endpoint shows how requests are automatically traced.
 *
 * US-011: Implement Request Tracing
 *
 * @example
 * ```bash
 * curl -H "Authorization: Bearer <token>" \
 *   https://api.example.com/api/internal/tracing-demo
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRequestTracing, logServiceHitForRequest } from '@/lib/middleware/request-tracing';
import type { ServiceName } from '@/lib/request-tracing';

/**
 * GET /api/internal/tracing-demo
 *
 * Demo endpoint that shows request tracing in action.
 * Automatically traced by withRequestTracing wrapper.
 *
 * This endpoint:
 * - Starts a request trace with correlation ID
 * - Logs various service hits
 * - Ends trace with total duration
 *
 * Try it and then query the trace:
 * ```bash
 * # Make a request
 * curl -H "Authorization: Bearer <token>" \
 *   https://api.example.com/api/internal/tracing-demo
 *
 * # Get the trace using the correlation_id from response
 * curl -H "Authorization: Bearer <token>" \
 *   https://api.example.com/api/traces/<correlation_id>
 * ```
 */
export const GET = withRequestTracing(async (req: NextRequest) => {
  // Simulate some service calls
  // In a real endpoint, these would be actual service calls
  logServiceHitForRequest(req, 'database' as ServiceName);
  await new Promise(resolve => setTimeout(resolve, 50));

  logServiceHitForRequest(req, 'auth' as ServiceName);
  await new Promise(resolve => setTimeout(resolve, 30));

  logServiceHitForRequest(req, 'storage' as ServiceName);
  await new Promise(resolve => setTimeout(resolve, 20));

  return NextResponse.json({
    message: 'Request tracing demo',
    description: 'This endpoint demonstrates automatic request tracing',
    instructions: {
      step1: 'Make a request to this endpoint',
      step2: 'Copy the correlation_id from the response headers',
      step3: 'Query /api/traces/:requestId with that ID',
      step4: 'See the complete trace with services hit and duration',
    },
    note: 'All requests are automatically traced with timing information',
  });
});

/**
 * POST /api/internal/tracing-demo
 *
 * Demo endpoint for POST requests with tracing.
 */
export const POST = withRequestTracing(async (req: NextRequest) => {
  // Simulate processing
  logServiceHitForRequest(req, 'database' as ServiceName);
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json({
    message: 'POST request traced',
    timestamp: new Date().toISOString(),
  });
});

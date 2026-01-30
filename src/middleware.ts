/**
 * Next.js Middleware
 *
 * Applies correlation ID to all API routes for request tracing.
 * This ensures every request has a unique ID for debugging and monitoring.
 *
 * US-003: Add Correlation ID to API Gateway
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateCorrelationId, extractCorrelationId, CORRELATION_HEADER } from '@/lib/middleware/correlation'

/**
 * Middleware configuration
 * matcher defines which routes this middleware applies to
 */
export const config = {
  // Apply to all API routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/**
 * Next.js Middleware Function
 *
 * Applies correlation ID to all matching requests:
 * 1. Extracts existing x-request-id header if present
 * 2. Generates new UUID if no existing ID
 * 3. Sets x-request-id on response headers for traceability
 *
 * @param request - Next.js request object
 * @returns NextResponse with correlation ID header
 *
 * @example
 * // Client can see their correlation ID in response headers
 * fetch('/api/projects')
 *   .then(res => {
 *     console.log('Request ID:', res.headers.get('x-request-id'))
 *   })
 */
export function middleware(request: NextRequest) {
  // Extract existing correlation ID from headers or generate new one
  const existingId = request.headers.get(CORRELATION_HEADER)
  const correlationId = existingId || generateCorrelationId()

  // Create response with correlation ID header
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set correlation ID on response for client-side tracing
  response.headers.set(CORRELATION_HEADER, correlationId)

  return response
}

/**
 * Correlation ID Middleware
 *
 * Middleware for generating and propagating correlation IDs across requests.
 * Ensures every request has a unique ID for tracing through the system.
 *
 * US-002: Implement Correlation ID Middleware
 *
 * @example
 * ```typescript
 * import { withCorrelationId } from '@/lib/middleware/correlation';
 * import { NextRequest } from 'next/server';
 *
 * // In an API route
 * export async function GET(req: NextRequest) {
 *   const correlationId = withCorrelationId(req);
 *   console.log('Request ID:', correlationId);
 *   return NextResponse.json({ correlationId });
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';

/**
 * Header name for correlation ID (standard: x-request-id)
 */
export const CORRELATION_HEADER = 'x-request-id';

/**
 * Generate a new correlation ID using UUID v4 format
 * Works in Edge Runtime without crypto module
 *
 * @returns A new UUID v4 string
 */
export function generateCorrelationId(): string {
  // Generate UUID v4 format that works in Edge Runtime
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Extract correlation ID from request headers
 *
 * Checks the x-request-id header for an existing correlation ID.
 *
 * @param req - Next.js request object
 * @returns The correlation ID from headers, or null if not present
 *
 * @example
 * ```typescript
 * const existingId = extractCorrelationId(request);
 * if (existingId) {
 *   console.log('Using existing correlation ID:', existingId);
 * }
 * ```
 */
export function extractCorrelationId(req: NextRequest): string | null {
  return req.headers.get(CORRELATION_HEADER);
}

/**
 * Apply correlation ID to a request
 *
 * - Extracts existing correlation ID from x-request-id header if present
 * - Generates a new UUID if no existing ID is found
 * - Sets req.id property to the correlation ID
 *
 * @param req - Next.js request object
 * @returns The correlation ID (existing or newly generated)
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const correlationId = withCorrelationId(req);
 *   // Use correlationId for logging, tracing, etc.
 *   return NextResponse.json({ id: correlationId });
 * }
 * ```
 */
export function withCorrelationId(req: NextRequest): string {
  const existingId = extractCorrelationId(req);
  const correlationId = existingId || generateCorrelationId();

  // Attach correlation ID to request object for downstream use
  (req as any).id = correlationId;

  return correlationId;
}

/**
 * Add correlation ID to response headers
 *
 * Ensures the correlation ID is propagated back to the client
 * in the response headers for traceability.
 *
 * @param res - Next.js response object or standard Response
 * @param correlationId - The correlation ID to add to headers
 * @returns The modified response with correlation ID header (preserves type)
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const correlationId = withCorrelationId(req);
 *   let res = NextResponse.json({ data: '...' });
 *   res = setCorrelationHeader(res, correlationId);
 *   return res;
 * }
 * ```
 */
export function setCorrelationHeader<T = unknown>(
  res: NextResponse<T> | Response,
  correlationId: string
): NextResponse<T> {
  if (res instanceof NextResponse) {
    res.headers.set(CORRELATION_HEADER, correlationId);
    return res;
  }
  // Convert standard Response to NextResponse
  const nextRes = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
  nextRes.headers.set(CORRELATION_HEADER, correlationId);
  return nextRes as NextResponse<T>;
}

/**
 * Express-style middleware wrapper for correlation ID
 *
 * This function creates middleware compatible with Express-style patterns.
 * It can be used with Next.js middleware.ts or custom middleware chains.
 *
 * @param req - Next.js request object
 * @param res - Next.js response object
 * @param next - Next function to continue the middleware chain
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * import { correlationMiddleware } from '@/lib/middleware/correlation';
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * export function middleware(req: NextRequest) {
 *   return correlationMiddleware(req);
 * }
 * ```
 */
export function correlationMiddleware(
  req: NextRequest,
  res?: Response
): NextResponse | void {
  const correlationId = withCorrelationId(req);

  // If response provided, set correlation header
  if (res && res instanceof NextResponse) {
    return setCorrelationHeader(res as NextResponse, correlationId);
  }

  // Return early response for Next.js middleware pattern
  const response = NextResponse.next();
  response.headers.set(CORRELATION_HEADER, correlationId);
  return response;
}

/**
 * Get the correlation ID from a request
 *
 * Safely retrieves the correlation ID that was set by withCorrelationId().
 * Returns null if no correlation ID has been set.
 *
 * @param req - Next.js request object
 * @returns The correlation ID or null
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   // Ensure correlation ID is set first
 *   withCorrelationId(req);
 *
 *   // Later in the code or in a helper function
 *   const correlationId = getCorrelationId(req);
 *   console.log('Processing request:', correlationId);
 * }
 * ```
 */
export function getCorrelationId(req: NextRequest): string | null {
  return (req as any).id || extractCorrelationId(req) || null;
}

/**
 * Type augmentation for NextRequest to include correlation ID
 *
 * This allows TypeScript to recognize the `id` property on NextRequest.
 */
declare module 'next/server' {
  interface NextRequest {
    /** Correlation ID for request tracing */
    id?: string;
  }
}

/**
 * Higher-order function to wrap API route handlers with correlation ID
 *
 * Automatically applies correlation ID to the request and adds it to the response.
 *
 * @param handler - The API route handler function
 * @returns A wrapped handler with correlation ID support
 *
 * @example
 * ```typescript
 * import { withCorrelation } from '@/lib/middleware/correlation';
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * const handler = async (req: NextRequest) => {
 *   const correlationId = getCorrelationId(req);
 *   return NextResponse.json({ message: 'OK', correlationId });
 * };
 *
 * export const GET = withCorrelation(handler);
 * export const POST = withCorrelation(handler);
 * ```
 */
export function withCorrelation<T extends NextRequest>(
  handler: (req: T, ...args: any[]) => Promise<Response> | Response
): (req: T, ...args: any[]) => Promise<NextResponse> {
  return async (req: T, ...args: any[]): Promise<NextResponse> => {
    // Apply correlation ID to request
    const correlationId = withCorrelationId(req);

    // Call the original handler
    const response = await handler(req, ...args);

    // Ensure correlation ID is in response headers
    if (response instanceof NextResponse) {
      return setCorrelationHeader(response, correlationId);
    }

    return response as NextResponse;
  };
}

export default withCorrelationId;

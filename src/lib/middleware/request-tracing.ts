/**
 * Request Tracing Middleware
 *
 * Middleware wrapper for automatically tracing requests through services.
 * Logs request start/end and service hits.
 *
 * US-011: Implement Request Tracing
 *
 * @example
 * ```typescript
 * import { withRequestTracing } from '@/lib/middleware/request-tracing';
 * import { NextRequest } from 'next/server';
 *
 * // In an API route
 * export const GET = withRequestTracing(async (req, user) => {
 *   // Your handler logic here
 *   return NextResponse.json({ data: '...' });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';
import { withCorrelationId, getCorrelationId, CORRELATION_HEADER } from './correlation';
import {
  startRequestTrace,
  endRequestTrace,
  logServiceHit,
  type ServiceName,
} from '../request-tracing';

/**
 * Extract project ID from JWT token in request
 */
function extractProjectIdFromRequest(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Decode JWT without verifying (just to get project_id)
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.project_id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract service name from request path
 */
function extractServiceName(path: string): ServiceName {
  if (path.startsWith('/api/database')) return 'database';
  if (path.startsWith('/api/auth')) return 'auth';
  if (path.startsWith('/api/graphql')) return 'graphql';
  if (path.startsWith('/api/realtime')) return 'realtime';
  if (path.startsWith('/api/storage')) return 'storage';
  if (path.startsWith('/api/functions')) return 'functions';
  if (path.startsWith('/api/webhooks')) return 'webhooks';
  return 'developer-portal';
}

/**
 * Request tracing wrapper for API route handlers
 *
 * Automatically:
 * - Applies correlation ID to request
 * - Starts request trace with project ID, path, and method
 * - Logs service hits
 * - Ends trace with total duration
 * - Handles errors gracefully
 *
 * @param handler - The API route handler to wrap
 * @param serviceName - Optional service name (auto-detected from path if not provided)
 * @returns A wrapped handler with request tracing support
 *
 * @example
 * ```typescript
 * import { withRequestTracing } from '@/lib/middleware/request-tracing';
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * const handler = async (req: NextRequest) => {
 *   const correlationId = getCorrelationId(req);
 *   return NextResponse.json({ message: 'OK', correlationId });
 * };
 *
 * export const GET = withRequestTracing(handler);
 * export const POST = withRequestTracing(handler);
 * ```
 */
export function withRequestTracing<T extends NextRequest>(
  handler: (req: T, ...args: any[]) => Promise<Response> | Response,
  serviceName?: ServiceName
): (req: T, ...args: any[]) => Promise<NextResponse> {
  return async (req: T, ...args: any[]): Promise<NextResponse> => {
    // Apply correlation ID to request
    const correlationId = withCorrelationId(req);

    // Extract project ID from JWT
    const projectId = extractProjectIdFromRequest(req);

    // Extract path and method
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Determine service name
    const service = serviceName || extractServiceName(path);

    // Start the trace (don't await to avoid blocking)
    if (projectId) {
      startRequestTrace(correlationId, projectId, path, method).catch((error) => {
        console.error(`[RequestTracing] Failed to start trace:`, error);
      });

      // Log the initial service hit
      logServiceHit(correlationId, service).catch((error) => {
        console.error(`[RequestTracing] Failed to log service hit:`, error);
      });
    }

    // Call the original handler
    const startTime = Date.now();
    let response: Response;
    let statusCode = 200;

    try {
      response = await handler(req, ...args);
      statusCode = (response as any).status || 200;
    } catch (error) {
      statusCode = 500;
      throw error;
    } finally {
      // End the trace with total duration
      if (projectId) {
        const duration = Date.now() - startTime;
        endRequestTrace(correlationId).catch((error) => {
          console.error(`[RequestTracing] Failed to end trace:`, error);
        });
      }
    }

    // Ensure correlation ID is in response headers
    if (response instanceof NextResponse) {
      response.headers.set(CORRELATION_HEADER, correlationId);
      return response;
    }

    return response as NextResponse;
  };
}

/**
 * Log a service hit for the current request
 *
 * Helper function to log when a service is hit during request processing.
 * Can be called from within handlers to log additional service hits.
 *
 * @param req - Next.js request object
 * @param service - The name of the service being hit
 *
 * @example
 * ```typescript
 * import { logServiceHitForRequest } from '@/lib/middleware/request-tracing';
 *
 * export async function GET(req: NextRequest) {
 *   // Log that we're hitting the database
 *   logServiceHitForRequest(req, 'database');
 *
 *   const pool = getPool();
 *   await pool.query('SELECT * FROM users');
 *
 *   return NextResponse.json({ users: [] });
 * }
 * ```
 */
export function logServiceHitForRequest(req: NextRequest, service: ServiceName): void {
  const correlationId = getCorrelationId(req);
  if (!correlationId) {
    return;
  }

  // Log asynchronously (fire and forget)
  logServiceHit(correlationId, service).catch((error) => {
    console.error(`[RequestTracing] Failed to log service hit:`, error);
  });
}

/**
 * Type augmentation for NextRequest to include tracing helpers
 *
 * This allows TypeScript to recognize the tracing methods on NextRequest.
 */
declare module 'next/server' {
  interface NextRequest {
    /**
     * Log a service hit for this request
     */
    logServiceHit?(service: ServiceName): void;
  }
}

/**
 * Enhanced request tracing wrapper that adds helper methods to request
 *
 * Same as withRequestTracing but also adds req.logServiceHit() method
 * for convenient service hit logging.
 */
export function withRequestTracingEnhanced<T extends NextRequest>(
  handler: (req: T, ...args: any[]) => Promise<Response> | Response,
  serviceName?: ServiceName
): (req: T, ...args: any[]) => Promise<NextResponse> {
  return async (req: T, ...args: any[]): Promise<NextResponse> => {
    // Apply correlation ID to request
    const correlationId = withCorrelationId(req);

    // Add logServiceHit helper to request
    (req as any).logServiceHit = (service: ServiceName) => {
      logServiceHit(correlationId, service).catch((error) => {
        console.error(`[RequestTracing] Failed to log service hit:`, error);
      });
    };

    // Extract project ID from JWT
    const projectId = extractProjectIdFromRequest(req);

    // Extract path and method
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Determine service name
    const service = serviceName || extractServiceName(path);

    // Start the trace (don't await to avoid blocking)
    if (projectId) {
      startRequestTrace(correlationId, projectId, path, method).catch((error) => {
        console.error(`[RequestTracing] Failed to start trace:`, error);
      });

      // Log the initial service hit
      logServiceHit(correlationId, service).catch((error) => {
        console.error(`[RequestTracing] Failed to log service hit:`, error);
      });
    }

    // Call the original handler
    let response: Response;

    try {
      response = await handler(req, ...args);
    } finally {
      // End the trace with total duration
      if (projectId) {
        endRequestTrace(correlationId).catch((error) => {
          console.error(`[RequestTracing] Failed to end trace:`, error);
        });
      }
    }

    // Ensure correlation ID is in response headers
    if (response instanceof NextResponse) {
      response.headers.set(CORRELATION_HEADER, correlationId);
      return response;
    }

    return response as NextResponse;
  };
}

export default withRequestTracing;

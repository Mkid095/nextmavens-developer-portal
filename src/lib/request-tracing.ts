/**
 * Request Tracing Module
 *
 * Provides distributed tracing functionality for tracking requests across services.
 * Logs request flow through the system with timing information.
 *
 * US-011: Implement Request Tracing
 *
 * @example
 * ```typescript
 * import { startRequestTrace, logServiceHit, endRequestTrace } from '@/lib/request-tracing';
 * import { getCorrelationId } from '@/lib/middleware/correlation';
 *
 * // In an API route
 * export async function GET(req: NextRequest) {
 *   const correlationId = getCorrelationId(req);
 *   const projectId = extractProjectId(req);
 *
 *   // Start tracing
 *   await startRequestTrace(correlationId, projectId, req.url, req.method);
 *
 *   // Log service hits
 *   await logServiceHit(correlationId, 'database');
 *   await logServiceHit(correlationId, 'auth');
 *
 *   // End trace with duration
 *   await endRequestTrace(correlationId);
 * }
 * ```
 */

// Re-export types
export type { ServiceName, RequestTrace, ActiveTrace } from './request-tracing/types';
export type { ProjectTracesOptions, TraceStats } from './request-tracing/types';

// Re-export query functions
export { getRequestTrace, getProjectTraces, cleanupOldTraces, getTraceStats } from './request-tracing/propagation';

// Re-export context functions
export { getActiveTrace } from './request-tracing/context';

import { createActiveTrace, addServiceToTrace, removeActiveTrace, getTraceServices } from './request-tracing/context';
import { createInitialTraceRecord, updateServicesHit, finalizeTraceRecord } from './request-tracing/spans';
import type { ServiceName } from './request-tracing/types';

/**
 * Start a new request trace
 *
 * Initializes a trace for the given request ID. The trace is stored in memory
 * until endRequestTrace is called.
 *
 * @param requestId - The correlation/request ID
 * @param projectId - The project ID making the request
 * @param path - The request path/URL
 * @param method - The HTTP method
 * @returns Promise that resolves when the trace is started
 *
 * @example
 * ```typescript
 * await startRequestTrace(
 *   correlationId,
 *   projectId,
 *   '/api/projects/123',
 *   'GET'
 * );
 * ```
 */
export async function startRequestTrace(
  requestId: string,
  projectId: string,
  path: string,
  method: string
): Promise<void> {
  // Store the active trace in memory
  createActiveTrace(requestId, projectId, path, method);

  // Also create initial record in database (async, don't await)
  createInitialTraceRecord(requestId, projectId, path, method).catch((error) => {
    console.error(`[RequestTracing] Failed to create initial trace record:`, error);
  });
}

/**
 * Log a service hit for the current request
 *
 * Adds a service to the list of services hit during this request.
 * If the service is already in the list, it won't be duplicated.
 *
 * @param requestId - The correlation/request ID
 * @param service - The name of the service being hit
 * @returns Promise that resolves when the service is logged
 *
 * @example
 * ```typescript
 * await logServiceHit(correlationId, 'database');
 * await logServiceHit(correlationId, 'auth');
 * ```
 */
export async function logServiceHit(
  requestId: string,
  service: ServiceName
): Promise<void> {
  const added = addServiceToTrace(requestId, service);
  if (!added) {
    // No active trace, create one if we have a project ID
    // This can happen if the request started in a different service
    console.warn(`[RequestTracing] No active trace found for request ID: ${requestId}`);
    return;
  }

  // Update the database asynchronously
  const services = getTraceServices(requestId);
  updateServicesHit(requestId, services as ServiceName[]).catch((error) => {
    console.error(`[RequestTracing] Failed to update services hit:`, error);
  });
}

/**
 * End a request trace and record the total duration
 *
 * Calculates the total duration from start time and updates the database record.
 * Also removes the trace from the active traces cache.
 *
 * @param requestId - The correlation/request ID
 * @returns Promise that resolves when the trace is ended
 *
 * @example
 * ```typescript
 * // At the end of request processing
 * await endRequestTrace(correlationId);
 * ```
 */
export async function endRequestTrace(requestId: string): Promise<void> {
  const trace = removeActiveTrace(requestId);
  if (!trace) {
    console.warn(`[RequestTracing] No active trace found for request ID: ${requestId}`);
    return;
  }

  // Calculate total duration
  const totalDurationMs = Date.now() - trace.start_time;

  // Update the database with the final duration
  finalizeTraceRecord(requestId, totalDurationMs).catch((error) => {
    console.error(`[RequestTracing] Failed to finalize trace record:`, error);
  });
}

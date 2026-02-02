/**
 * Request Tracing Context Management
 *
 * Manages the in-memory store for active request traces.
 * In production with multiple instances, this would be replaced with Redis.
 */

import type { ActiveTrace } from './types';

/**
 * Active traces cache (in-memory)
 */
const activeTraces = new Map<string, ActiveTrace>();

/**
 * Create and store a new active trace
 *
 * @param requestId - The correlation/request ID
 * @param projectId - The project ID making the request
 * @param path - The request path/URL
 * @param method - The HTTP method
 * @returns The created active trace
 */
export function createActiveTrace(
  requestId: string,
  projectId: string,
  path: string,
  method: string
): ActiveTrace {
  const trace: ActiveTrace = {
    request_id: requestId,
    project_id: projectId,
    path,
    method,
    start_time: Date.now(),
    services: new Set(),
  };

  activeTraces.set(requestId, trace);
  return trace;
}

/**
 * Get an active trace by request ID
 *
 * @param requestId - The correlation/request ID
 * @returns The active trace or undefined
 */
export function getActiveTrace(requestId: string): ActiveTrace | undefined {
  return activeTraces.get(requestId);
}

/**
 * Add a service to an active trace
 *
 * @param requestId - The correlation/request ID
 * @param service - The service name to add
 * @returns True if the service was added, false if trace not found
 */
export function addServiceToTrace(
  requestId: string,
  service: string
): boolean {
  const trace = activeTraces.get(requestId);
  if (!trace) {
    return false;
  }

  trace.services.add(service as any);
  return true;
}

/**
 * Remove and return an active trace
 *
 * @param requestId - The correlation/request ID
 * @returns The removed active trace or undefined
 */
export function removeActiveTrace(requestId: string): ActiveTrace | undefined {
  const trace = activeTraces.get(requestId);
  if (trace) {
    activeTraces.delete(requestId);
  }
  return trace;
}

/**
 * Get all services from an active trace
 *
 * @param requestId - The correlation/request ID
 * @returns Array of service names or empty array if trace not found
 */
export function getTraceServices(requestId: string): string[] {
  const trace = activeTraces.get(requestId);
  return trace ? Array.from(trace.services) : [];
}

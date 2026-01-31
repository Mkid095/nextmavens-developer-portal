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

import { getPool } from './db';
import type { Pool, PoolClient } from 'pg';

/**
 * Service names that can be hit during a request
 */
export type ServiceName =
  | 'gateway'
  | 'developer-portal'
  | 'control-plane-api'
  | 'database'
  | 'auth'
  | 'graphql'
  | 'realtime'
  | 'storage'
  | 'functions'
  | 'webhooks';

/**
 * Request trace entry from the database
 */
export interface RequestTrace {
  request_id: string;
  project_id: string;
  path: string;
  method: string;
  services_hit: ServiceName[];
  total_duration_ms: number | null;
  created_at: Date;
}

/**
 * In-memory store for active request traces with timing information
 * This allows us to track duration without blocking requests
 */
interface ActiveTrace {
  request_id: string;
  project_id: string;
  path: string;
  method: string;
  start_time: number;
  services: Set<ServiceName>;
}

/**
 * Active traces cache (in-memory)
 * In production with multiple instances, this would be replaced with Redis
 */
const activeTraces = new Map<string, ActiveTrace>();

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
  activeTraces.set(requestId, {
    request_id: requestId,
    project_id: projectId,
    path,
    method,
    start_time: Date.now(),
    services: new Set(),
  });

  // Also create initial record in database (async, don't await)
  createInitialTraceRecord(requestId, projectId, path, method).catch((error) => {
    console.error(`[RequestTracing] Failed to create initial trace record:`, error);
  });
}

/**
 * Create the initial trace record in the database
 *
 * This runs asynchronously to avoid blocking the request.
 */
async function createInitialTraceRecord(
  requestId: string,
  projectId: string,
  path: string,
  method: string
): Promise<void> {
  const pool = getPool();

  try {
    await pool.query(
      `INSERT INTO control_plane.request_traces (request_id, project_id, path, method, services_hit, total_duration_ms)
       VALUES ($1, $2, $3, $4, $5, NULL)
       ON CONFLICT (request_id) DO NOTHING`,
      [requestId, projectId, path, method, []]
    );
  } catch (error) {
    console.error(`[RequestTracing] Failed to insert initial trace:`, error);
  }
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
  const trace = activeTraces.get(requestId);
  if (!trace) {
    // No active trace, create one if we have a project ID
    // This can happen if the request started in a different service
    console.warn(`[RequestTracing] No active trace found for request ID: ${requestId}`);
    return;
  }

  // Add the service to the set (duplicates are automatically ignored)
  trace.services.add(service);

  // Update the database asynchronously
  updateServicesHit(requestId, Array.from(trace.services)).catch((error) => {
    console.error(`[RequestTracing] Failed to update services hit:`, error);
  });
}

/**
 * Update the services_hit array in the database
 *
 * This runs asynchronously to avoid blocking the request.
 */
async function updateServicesHit(
  requestId: string,
  services: ServiceName[]
): Promise<void> {
  const pool = getPool();

  try {
    await pool.query(
      `UPDATE control_plane.request_traces
       SET services_hit = $1
       WHERE request_id = $2`,
      [JSON.stringify(services), requestId]
    );
  } catch (error) {
    console.error(`[RequestTracing] Failed to update services hit:`, error);
  }
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
  const trace = activeTraces.get(requestId);
  if (!trace) {
    console.warn(`[RequestTracing] No active trace found for request ID: ${requestId}`);
    return;
  }

  // Calculate total duration
  const totalDurationMs = Date.now() - trace.start_time;

  // Remove from active traces
  activeTraces.delete(requestId);

  // Update the database with the final duration
  finalizeTraceRecord(requestId, totalDurationMs).catch((error) => {
    console.error(`[RequestTracing] Failed to finalize trace record:`, error);
  });
}

/**
 * Finalize the trace record in the database with duration
 *
 * This runs asynchronously to avoid blocking the request.
 */
async function finalizeTraceRecord(
  requestId: string,
  totalDurationMs: number
): Promise<void> {
  const pool = getPool();

  try {
    await pool.query(
      `UPDATE control_plane.request_traces
       SET total_duration_ms = $1
       WHERE request_id = $2`,
      [totalDurationMs, requestId]
    );
  } catch (error) {
    console.error(`[RequestTracing] Failed to finalize trace:`, error);
  }
}

/**
 * Get a request trace by request ID
 *
 * Retrieves the complete trace information for a specific request.
 *
 * @param requestId - The correlation/request ID
 * @returns The request trace or null if not found
 *
 * @example
 * ```typescript
 * const trace = await getRequestTrace(correlationId);
 * if (trace) {
 *   console.log('Request hit services:', trace.services_hit);
 *   console.log('Total duration:', trace.total_duration_ms, 'ms');
 * }
 * ```
 */
export async function getRequestTrace(
  requestId: string
): Promise<RequestTrace | null> {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT request_id, project_id, path, method, services_hit, total_duration_ms, created_at
       FROM control_plane.request_traces
       WHERE request_id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      request_id: row.request_id,
      project_id: row.project_id,
      path: row.path,
      method: row.method,
      services_hit: row.services_hit || [],
      total_duration_ms: row.total_duration_ms,
      created_at: row.created_at,
    };
  } catch (error) {
    console.error(`[RequestTracing] Failed to get trace:`, error);
    throw error;
  }
}

/**
 * Get request traces for a project
 *
 * Retrieves all traces for a specific project, optionally filtered by time range.
 *
 * @param projectId - The project ID
 * @param options - Optional filters (startDate, endDate, limit)
 * @returns Array of request traces
 *
 * @example
 * ```typescript
 * // Get last 100 traces for a project
 * const traces = await getProjectTraces(projectId, { limit: 100 });
 *
 * // Get traces from the last hour
 * const traces = await getProjectTraces(projectId, {
 *   startDate: new Date(Date.now() - 60 * 60 * 1000)
 * });
 * ```
 */
export async function getProjectTraces(
  projectId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<RequestTrace[]> {
  const pool = getPool();

  try {
    let query = `
      SELECT request_id, project_id, path, method, services_hit, total_duration_ms, created_at
      FROM control_plane.request_traces
      WHERE project_id = $1
    `;
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (options?.startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }

    const result = await pool.query(query, params);

    return result.rows.map((row) => ({
      request_id: row.request_id,
      project_id: row.project_id,
      path: row.path,
      method: row.method,
      services_hit: row.services_hit || [],
      total_duration_ms: row.total_duration_ms,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error(`[RequestTracing] Failed to get project traces:`, error);
    throw error;
  }
}

/**
 * Get the current active trace for a request
 *
 * Returns the in-memory trace if it exists, without querying the database.
 * Useful for middleware that needs to check if a trace is active.
 *
 * @param requestId - The correlation/request ID
 * @returns The active trace or undefined
 */
export function getActiveTrace(requestId: string): ActiveTrace | undefined {
  return activeTraces.get(requestId);
}

/**
 * Clean up old traces from the database
 *
 * Removes traces older than the specified number of days.
 * Useful for maintenance tasks.
 *
 * @param daysOld - Remove traces older than this many days
 * @returns The number of traces deleted
 *
 * @example
 * ```typescript
 * // Remove traces older than 30 days
 * const deletedCount = await cleanupOldTraces(30);
 * console.log(`Deleted ${deletedCount} old traces`);
 * ```
 */
export async function cleanupOldTraces(daysOld: number): Promise<number> {
  const pool = getPool();

  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `DELETE FROM control_plane.request_traces
       WHERE created_at < $1`,
      [cutoffDate]
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error(`[RequestTracing] Failed to cleanup old traces:`, error);
    throw error;
  }
}

/**
 * Get request tracing statistics for a project
 *
 * Returns aggregate statistics about request traces for a project.
 *
 * @param projectId - The project ID
 * @param options - Optional filters (startDate, endDate)
 * @returns Statistics about traces
 *
 * @example
 * ```typescript
 * const stats = await getTraceStats(projectId, {
 *   startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
 * });
 * console.log('Total requests:', stats.total_requests);
 * console.log('Average duration:', stats.avg_duration_ms, 'ms');
 * console.log('Most common services:', stats.top_services);
 * ```
 */
export async function getTraceStats(
  projectId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  total_requests: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  top_services: Array<{ service: ServiceName; count: number }>;
}> {
  const pool = getPool();

  try {
    // Get basic stats
    let statsQuery = `
      SELECT
        COUNT(*) as total_requests,
        AVG(total_duration_ms) as avg_duration_ms,
        MAX(total_duration_ms) as max_duration_ms,
        MIN(total_duration_ms) as min_duration_ms
      FROM control_plane.request_traces
      WHERE project_id = $1
        AND total_duration_ms IS NOT NULL
    `;
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (options?.startDate) {
      statsQuery += ` AND created_at >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      statsQuery += ` AND created_at <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    const statsResult = await pool.query(statsQuery, params);
    const statsRow = statsResult.rows[0];

    // Get top services
    let servicesQuery = `
      SELECT jsonb_array_elements_text(services_hit) as service, COUNT(*) as count
      FROM control_plane.request_traces
      WHERE project_id = $1
    `;
    const servicesParams: any[] = [projectId];
    let servicesParamIndex = 2;

    if (options?.startDate) {
      servicesQuery += ` AND created_at >= $${servicesParamIndex}`;
      servicesParams.push(options.startDate);
      servicesParamIndex++;
    }

    if (options?.endDate) {
      servicesQuery += ` AND created_at <= $${servicesParamIndex}`;
      servicesParams.push(options.endDate);
      servicesParamIndex++;
    }

    servicesQuery += ` GROUP BY service ORDER BY count DESC LIMIT 10`;

    const servicesResult = await pool.query(servicesQuery, servicesParams);

    return {
      total_requests: parseInt(statsRow.total_requests) || 0,
      avg_duration_ms: Math.round(parseFloat(statsRow.avg_duration_ms) || 0),
      max_duration_ms: parseInt(statsRow.max_duration_ms) || 0,
      min_duration_ms: parseInt(statsRow.min_duration_ms) || 0,
      top_services: servicesResult.rows.map((row) => ({
        service: row.service as ServiceName,
        count: parseInt(row.count),
      })),
    };
  } catch (error) {
    console.error(`[RequestTracing] Failed to get trace stats:`, error);
    throw error;
  }
}

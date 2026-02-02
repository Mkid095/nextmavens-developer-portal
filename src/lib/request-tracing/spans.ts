/**
 * Request Tracing Span Operations
 *
 * Handles database operations for creating, updating, and finalizing trace spans.
 */

import { getPool } from '../db';
import type { ServiceName } from './types';

/**
 * Create the initial trace record in the database
 *
 * This runs asynchronously to avoid blocking the request.
 *
 * @param requestId - The correlation/request ID
 * @param projectId - The project ID making the request
 * @param path - The request path/URL
 * @param method - The HTTP method
 */
export async function createInitialTraceRecord(
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
    throw error;
  }
}

/**
 * Update the services_hit array in the database
 *
 * This runs asynchronously to avoid blocking the request.
 *
 * @param requestId - The correlation/request ID
 * @param services - Array of service names hit during the request
 */
export async function updateServicesHit(
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
    throw error;
  }
}

/**
 * Finalize the trace record in the database with duration
 *
 * This runs asynchronously to avoid blocking the request.
 *
 * @param requestId - The correlation/request ID
 * @param totalDurationMs - Total duration of the request in milliseconds
 */
export async function finalizeTraceRecord(
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
    throw error;
  }
}

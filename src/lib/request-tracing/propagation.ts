/**
 * Request Tracing Query Operations
 *
 * Handles database queries for retrieving trace information.
 */

import { getPool } from '../db';
import type { RequestTrace, ProjectTracesOptions, TraceStats } from './types';

/**
 * Get a request trace by request ID
 *
 * Retrieves the complete trace information for a specific request.
 *
 * @param requestId - The correlation/request ID
 * @returns The request trace or null if not found
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
 */
export async function getProjectTraces(
  projectId: string,
  options?: ProjectTracesOptions
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
 * Clean up old traces from the database
 *
 * Removes traces older than the specified number of days.
 * Useful for maintenance tasks.
 *
 * @param daysOld - Remove traces older than this many days
 * @returns The number of traces deleted
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
 */
export async function getTraceStats(
  projectId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<TraceStats> {
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
        service: row.service as any,
        count: parseInt(row.count),
      })),
    };
  } catch (error) {
    console.error(`[RequestTracing] Failed to get trace stats:`, error);
    throw error;
  }
}

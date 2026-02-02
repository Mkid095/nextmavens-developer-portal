/**
 * Request Tracing Types
 *
 * Shared types and interfaces for the request tracing system.
 */

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
export interface ActiveTrace {
  request_id: string;
  project_id: string;
  path: string;
  method: string;
  start_time: number;
  services: Set<ServiceName>;
}

/**
 * Options for querying project traces
 */
export interface ProjectTracesOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Request trace statistics
 */
export interface TraceStats {
  total_requests: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  top_services: Array<{ service: ServiceName; count: number }>;
}

/**
 * Request Tracing Module - Public API
 *
 * Main entry point for all request tracing functionality.
 * Re-exports all types and functions for convenient importing.
 *
 * @example
 * ```typescript
 * // Import everything from the main module
 * import {
 *   startRequestTrace,
 *   logServiceHit,
 *   endRequestTrace,
 *   getRequestTrace,
 *   getProjectTraces
 * } from '@/lib/request-tracing';
 *
 * // Or import types
 * import type { ServiceName, RequestTrace } from '@/lib/request-tracing';
 * ```
 */

// Types
export type { ServiceName, RequestTrace, ActiveTrace, ProjectTracesOptions, TraceStats } from './types';

// Main tracing operations
export { startRequestTrace, logServiceHit, endRequestTrace } from './request-tracing';

// Query operations
export { getRequestTrace, getProjectTraces, cleanupOldTraces, getTraceStats } from './propagation';

// Context management
export { getActiveTrace } from './context';

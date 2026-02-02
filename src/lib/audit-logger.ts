/**
 * Unified Audit Logger
 *
 * @deprecated This file has been refactored into the audit-logger-module.
 * Please import from './audit-logger-module' instead.
 *
 * US-008: Add Correlation ID to Audit Logs
 *
 * Provides comprehensive audit logging using the control_plane.audit_logs schema.
 * Captures correlation ID from x-request-id header for request tracing.
 */

export * from './audit-logger-module'

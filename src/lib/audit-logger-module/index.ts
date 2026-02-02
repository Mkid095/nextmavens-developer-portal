/**
 * Audit Logger Module
 *
 * Provides comprehensive audit logging using the control_plane.audit_logs schema.
 * Captures correlation ID from x-request-id header for request tracing.
 *
 * US-008: Add Correlation ID to Audit Logs
 * US-011: Local sanitization functions for audit logging
 */

// Type definitions
export * from './types'

// Sanitization functions
export * from './sanitization'

// Request extraction functions
export * from './request-extractors'

// Core audit logging functions
export * from './core'

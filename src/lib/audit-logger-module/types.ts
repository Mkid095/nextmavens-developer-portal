/**
 * Audit Logger - Type Definitions
 *
 * US-008: Add Correlation ID to Audit Logs
 * US-011: Local sanitization functions for audit logging
 */

import type { NextRequest } from 'next/server'

/**
 * Audit actor types
 */
export type AuditActorType = 'user' | 'system' | 'api_key' | 'project' | 'mcp_token'

/**
 * Target entity types
 */
export type AuditTargetType = 'project' | 'api_key' | 'user' | 'secret' | 'feature_flag' | 'suspension' | 'quota'

/**
 * Unified audit log entry structure
 * Matches control_plane.audit_logs table schema
 */
export interface AuditLogEntry {
  actor_id: string
  actor_type: AuditActorType
  action: string
  target_type: AuditTargetType
  target_id: string
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  request_id?: string // Correlation ID from x-request-id header
  project_id?: string
}

/**
 * Audit log entry from request (auto-fills IP, user agent, request ID)
 */
export type AuditLogFromRequest = Omit<AuditLogEntry, 'ip_address' | 'user_agent' | 'request_id'>

/**
 * MCP Audit Logger - Type Definitions
 *
 * US-008: Implement MCP Audit Logging
 *
 * Type definitions and interfaces for MCP audit logging functionality.
 */

import { NextRequest } from 'next/server'

/**
 * MCP audit log entry structure
 * US-008: Added requestId field for correlation tracking
 */
export interface McpAuditLogEntry {
  apiKeyId: string
  projectId: string
  keyType: string
  keyPrefix: string
  operation: string
  endpoint: string
  method: string
  payload: Record<string, unknown>
  mcpAccessLevel: 'ro' | 'rw' | 'admin' | 'unknown'
  statusCode?: number
  responseTimeMs?: number
  ipAddress: string
  userAgent: string
  requestId?: string // US-008: Correlation ID from x-request-id header
  aiTool?: string // Detected AI/IDE tool from user agent
  ideVersion?: string // Extracted IDE version if available
  occurredAt: Date
}

/**
 * MCP access level type
 */
export type McpAccessLevel = 'ro' | 'rw' | 'admin' | 'unknown'

/**
 * Severity level for audit logs
 */
export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical'

/**
 * Audit log query options
 */
export interface AuditLogQueryOptions {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}

/**
 * MCP audit log entry (from database)
 */
export interface McpAuditLog {
  id: string
  apiKeyId: string
  projectId: string
  keyType: string
  keyPrefix: string
  operation: string
  endpoint: string
  method: string
  payload: Record<string, unknown>
  mcpAccessLevel: McpAccessLevel
  statusCode?: number
  responseTimeMs?: number
  ipAddress: string
  userAgent: string
  aiTool?: string
  ideVersion?: string
  occurredAt: Date
}

/**
 * MCP audit statistics
 */
export interface McpAuditStats {
  totalRequests: number
  requestsByAccessLevel: Record<string, number>
  requestsByOperation: Record<string, number>
  requestsByAiTool: Record<string, number>
  averageResponseTime: number
  errorRate: number
}

/**
 * MCP token usage analytics
 */
export interface McpTokenUsageAnalytics {
  tokens: Array<{
    apiKeyId: string
    keyPrefix: string
    keyName: string
    mcpAccessLevel: McpAccessLevel
    requestCount: number
    operationsPerformed: Array<{
      operation: string
      count: number
    }>
    successCount: number
    errorCount: number
    successRate: number
    errorRate: number
    averageResponseTime: number
    lastUsed: Date | null
    firstUsed: Date | null
    aiToolsUsed: string[]
  }>
  total: number
}

/**
 * Handler function type for middleware
 */
export type McpAuditHandler<T> = (
  req: NextRequest,
  apiKey: { id: string; project_id: string; key_type: string; key_prefix: string }
) => Promise<{
  data?: T
  statusCode?: number
  error?: string
}>

/**
 * Middleware result type
 */
export type McpAuditMiddlewareResult<T> = {
  data?: T
  statusCode?: number
  error?: string
}

/**
 * MCP Audit Logger
 *
 * US-008: Implement MCP Audit Logging
 *
 * Provides comprehensive audit logging for MCP (Model Context Protocol) token operations.
 * All MCP actions are heavily audited to detect AI tool abuse.
 *
 * This module has been refactored into smaller, focused modules:
 * - types.ts: Type definitions and interfaces
 * - constants.ts: Constants used throughout the system
 * - utils.ts: Utility functions for detection and extraction
 * - logger.ts: Core logging functions
 * - middleware.ts: Middleware wrapper for automatic logging
 * - queries.ts: Query functions for audit logs
 * - analytics.ts: Token usage analytics and export
 *
 * @module mcp-audit-logger
 */

// Export all types
export type {
  McpAuditLogEntry,
  McpAccessLevel,
  SeverityLevel,
  AuditLogQueryOptions,
  McpAuditLog,
  McpAuditStats,
  McpTokenUsageAnalytics,
  McpAuditHandler,
  McpAuditMiddlewareResult,
} from './types'

// Export all constants
export {
  AI_TOOL_PATTERNS,
  IDE_VERSION_PATTERNS,
  SENSITIVE_FIELDS,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  EXPORT_LIMIT,
  AUDIT_LOG_TYPES,
  SEVERITY_LEVELS,
  STATUS_CODE_RANGES,
  MCP_KEY_PREFIXES,
  API_KEY_TYPES,
} from './constants'

// Export all utility functions
export {
  detectAiTool,
  extractIdeVersion,
  parseMcpAccessLevel,
  extractClientIp,
  extractUserAgent,
  getSeverityForStatusCode,
  sanitizePayload,
  determineOperation,
} from './utils'

// Export core logging functions
export { logMcpAction, logMcpScopeCheck, logMcpAuthFailure } from './logger'

// Export middleware
export { withMcpAuditLogging } from './middleware'

// Export query functions
export { getMcpAuditLogs, getMcpAuditStats } from './queries'

// Export analytics functions
export { getMcpTokenUsageAnalytics, exportMcpTokenUsageAnalyticsAsCsv } from './analytics'

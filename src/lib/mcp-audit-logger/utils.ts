/**
 * MCP Audit Logger - Utility Functions
 *
 * US-008: Implement MCP Audit Logging
 *
 * Utility functions for MCP audit logging including AI tool detection,
 * IP extraction, and helper functions.
 */

import { NextRequest } from 'next/server'
import { AI_TOOL_PATTERNS, MCP_KEY_PREFIXES, SENSITIVE_FIELDS, STATUS_CODE_RANGES } from './constants'
import type { McpAccessLevel, SeverityLevel } from './types'

/**
 * Detect AI tool from user agent string
 *
 * @param userAgent - The user agent string
 * @returns The detected AI tool name or undefined
 */
export function detectAiTool(userAgent: string): string | undefined {
  for (const [tool, pattern] of Object.entries(AI_TOOL_PATTERNS)) {
    if (pattern.test(userAgent)) {
      return tool
    }
  }
  return undefined
}

/**
 * Extract IDE version from user agent string
 *
 * @param userAgent - The user agent string
 * @returns The IDE version string or undefined
 */
export function extractIdeVersion(userAgent: string): string | undefined {
  const vscodeMatch = userAgent.match(/vscode\/([\d.]+)/i)
  if (vscodeMatch) {
    return `VSCode ${vscodeMatch[1]}`
  }

  // Check for JetBrains IDEs
  if (/jetbrains/i.test(userAgent)) {
    const ideaMatch = userAgent.match(/intellij\s+idea\s+([\d.]+)/i)
    if (ideaMatch) {
      return `IntelliJ IDEA ${ideaMatch[1]}`
    }
    return 'JetBrains IDE'
  }

  // Check for specific JetBrains IDEs
  if (/pycharm/i.test(userAgent)) {
    return 'PyCharm'
  }
  if (/webstorm/i.test(userAgent)) {
    return 'WebStorm'
  }

  // Check for Vim/Neovim
  if (/neovim\/([\d.]+)/i.test(userAgent)) {
    const neovimMatch = userAgent.match(/neovim\/([\d.]+)/i)
    if (neovimMatch) {
      return `Neovim ${neovimMatch[1]}`
    }
  }
  if (/vim/i.test(userAgent)) {
    return 'Vim'
  }

  return undefined
}

/**
 * Parse MCP access level from key prefix
 *
 * @param keyPrefix - The API key prefix (e.g., mcp_ro_, mcp_rw_)
 * @returns The MCP access level
 */
export function parseMcpAccessLevel(keyPrefix: string): McpAccessLevel {
  if (keyPrefix.startsWith(MCP_KEY_PREFIXES.READ_ONLY)) {
    return 'ro'
  }
  if (keyPrefix.startsWith(MCP_KEY_PREFIXES.READ_WRITE)) {
    return 'rw'
  }
  if (keyPrefix.startsWith(MCP_KEY_PREFIXES.ADMIN)) {
    return 'admin'
  }
  return 'unknown'
}

/**
 * Extract IP address from request
 *
 * @param req - The NextRequest object
 * @returns The client IP address
 */
export function extractClientIp(req: NextRequest): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Try cf-connecting-ip header (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  // Try x-real-ip header (Nginx)
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to connection info
  // @ts-ignore - ipAddress may be available in some environments
  if (req.ip) {
    return req.ip
  }

  return '0.0.0.0'
}

/**
 * Extract user agent from request
 *
 * @param req - The NextRequest object
 * @returns The user agent string
 */
export function extractUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'Unknown'
}

/**
 * Get severity level based on HTTP status code
 *
 * @param statusCode - The HTTP status code
 * @returns The severity level
 */
export function getSeverityForStatusCode(statusCode: number): SeverityLevel {
  if (statusCode >= STATUS_CODE_RANGES.CRITICAL_MIN) {
    return 'critical'
  }
  if (statusCode >= STATUS_CODE_RANGES.WARNING_MIN) {
    return 'warning'
  }
  return 'info'
}

/**
 * Sanitize payload to remove sensitive data
 *
 * @param payload - The request payload
 * @returns Sanitized payload
 */
export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...payload }

  // Redact sensitive fields that might contain credentials
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * Determine the operation type from request details
 *
 * @param url - The request URL
 * @param method - The HTTP method
 * @param payload - The request payload
 * @returns The operation string
 */
export function determineOperation(
  url: URL,
  method: string,
  payload: Record<string, unknown>
): string {
  // Extract operation from URL path
  const pathParts = url.pathname.split('/').filter(Boolean)

  // For /api/test/mcp-scope, return "test_scope_check"
  if (pathParts[0] === 'api' && pathParts[1] === 'test' && pathParts[2] === 'mcp-scope') {
    return 'test_scope_check'
  }

  // For /api/realtime/publish, return "realtime_publish"
  if (pathParts[0] === 'api' && pathParts[1] === 'realtime' && pathParts[2] === 'publish') {
    return 'realtime_publish'
  }

  // For database operations
  if (pathParts[1] === 'database') {
    return `database_${method.toLowerCase()}`
  }

  // For storage operations
  if (pathParts[1] === 'storage') {
    return `storage_${method.toLowerCase()}`
  }

  // Default: method_endpoint
  return `${method.toLowerCase()}_${pathParts.slice(-1).join('/') || 'unknown'}`
}

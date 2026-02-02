/**
 * Log Formatters
 *
 * Functions for formatting log messages, metadata, and sensitive data sanitization.
 */

import type { LogLevel } from './config'
import { getCurrentLogLevel } from './config'

/**
 * Sensitive keys that should be sanitized from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'jwt',
  'private',
  'credentials',
]

/**
 * Sanitize sensitive data from objects before logging
 * Removes passwords, tokens, and other sensitive fields
 *
 * @param data - The data to sanitize
 * @returns Sanitized data
 */
export function sanitizeSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    // Check if it looks like a JWT token
    if (data.length > 50 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
      return '[SANITIZED: Token]'
    }
    // Check if it looks like a bearer token
    if (data.toLowerCase().startsWith('bearer ')) {
      return '[SANITIZED: Bearer token]'
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeSensitiveData(item))
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()

      // Check if this is a sensitive key
      if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[SANITIZED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeSensitiveData(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  return data
}

/**
 * Format log metadata for output
 *
 * @param metadata - Optional metadata object
 * @returns Formatted metadata string
 */
export function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return ''
  }

  // In debug mode, include full metadata
  if (getCurrentLogLevel() === 'debug') {
    try {
      return JSON.stringify(metadata, null, 2)
    } catch {
      return '[metadata unavailable]'
    }
  }

  // In other modes, include summary
  const keys = Object.keys(metadata)
  if (keys.length <= 3) {
    try {
      return JSON.stringify(metadata)
    } catch {
      return '[metadata unavailable]'
    }
  }

  // Too many keys, show summary
  return `{ ${keys.slice(0, 3).join(', ')}... (+${keys.length - 3} more) }`
}

/**
 * Format a log entry with timestamp and level
 *
 * @param level - The log level
 * @param message - The log message
 * @param metadata - Optional metadata
 * @returns Formatted log string
 */
export function formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const metadataStr = formatMetadata(metadata)
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataStr ? ' ' + metadataStr : ''}`
}

/**
 * Sanitize headers for logging
 *
 * @param headers - Request headers to sanitize
 * @returns Sanitized headers object
 */
export function sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, unknown> {
  const sanitizedHeaders: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (lowerKey === 'authorization' || lowerKey === 'cookie') {
      sanitizedHeaders[key] = '[SANITIZED]'
    } else {
      sanitizedHeaders[key] = value
    }
  }

  return sanitizedHeaders
}

/**
 * Environment-Aware Logger
 *
 * Provides logging functionality that respects environment-specific log levels.
 * Dev and staging environments use debug level with full request/response logging.
 * Prod uses info level with sampled logging for performance.
 *
 * US-006: Implement Verbose Logging in Dev
 */

import { getEnvironmentConfig, type Environment } from './environment'

/**
 * Log levels in order of severity (lower = more verbose)
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log level priority (lower number = less severe)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Current log level for the application
 * Can be overridden by setting environment-specific log level
 */
let currentLogLevel: LogLevel = 'info'

/**
 * Sample rate for production logs (0-1)
 * In production, only log this fraction of info/debug logs to reduce noise
 */
const PRODUCTION_SAMPLE_RATE = 0.1

/**
 * Set the current log level based on environment
 *
 * @param environment - The environment to set log level for
 */
export function setLogLevel(environment: Environment): void {
  const config = getEnvironmentConfig(environment)
  currentLogLevel = config.log_level
}

/**
 * Check if a log should be output based on current log level
 *
 * @param level - The log level to check
 * @returns True if the log should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel]
}

/**
 * Check if production sampling should apply to this log
 *
 * @param level - The log level to check
 * @returns True if sampling should be applied
 */
function shouldSample(level: LogLevel): boolean {
  // Only sample debug and info logs in production (info level)
  if (currentLogLevel !== 'info') {
    return false
  }
  if (level === 'warn' || level === 'error') {
    return false // Always log warnings and errors
  }
  return Math.random() > PRODUCTION_SAMPLE_RATE
}

/**
 * Format log metadata for output
 *
 * @param metadata - Optional metadata object
 * @returns Formatted metadata string
 */
function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return ''
  }

  // In debug mode, include full metadata
  if (currentLogLevel === 'debug') {
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
function formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const metadataStr = formatMetadata(metadata)
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataStr ? ' ' + metadataStr : ''}`
}

/**
 * Log a debug message
 * Only logs if debug level is enabled
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function debug(message: string, metadata?: Record<string, unknown>): void {
  if (shouldLog('debug') && !shouldSample('debug')) {
    console.log(formatLog('debug', message, metadata))
  }
}

/**
 * Log an info message
 * Only logs if info level or higher is enabled
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function info(message: string, metadata?: Record<string, unknown>): void {
  if (shouldLog('info') && !shouldSample('info')) {
    console.log(formatLog('info', message, metadata))
  }
}

/**
 * Log a warning message
 * Always logged regardless of log level
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function warn(message: string, metadata?: Record<string, unknown>): void {
  // Warnings are never sampled
  console.warn(formatLog('warn', message, metadata))
}

/**
 * Log an error message
 * Always logged regardless of log level
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function error(message: string, metadata?: Record<string, unknown>): void {
  // Errors are never sampled
  console.error(formatLog('error', message, metadata))
}

/**
 * Logger class for scoped logging with context
 *
 * Useful for logging within specific modules or request contexts
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    debug(this.formatMessage(message), metadata)
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    info(this.formatMessage(message), metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    warn(this.formatMessage(message), metadata)
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    error(this.formatMessage(message), metadata)
  }
}

/**
 * Create a new logger instance with the given context
 *
 * @param context - The context name for the logger (e.g., module name)
 * @returns A new Logger instance
 *
 * @example
 * ```ts
 * const logger = createLogger('api-gateway')
 * logger.info('Request received', { path: '/api/v1/endpoint' })
 * // Output: [2024-01-30T12:34:56.789Z] [INFO] [api-gateway] Request received {"path":"/api/v1/endpoint"}
 * ```
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Sanitize sensitive data from objects before logging
 * Removes passwords, tokens, and other sensitive fields
 *
 * @param data - The data to sanitize
 * @returns Sanitized data
 */
function sanitizeSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

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
 * Log an HTTP request with full details in debug mode
 *
 * @param method - HTTP method
 * @param path - Request path
 * @param metadata - Optional request metadata
 * @param body - Optional request body (included in debug mode)
 * @param headers - Optional request headers (included in debug mode)
 */
export function logRequest(
  method: string,
  path: string,
  metadata?: Record<string, unknown>,
  body?: unknown,
  headers?: Record<string, string | string[] | undefined>
): void {
  const message = `${method} ${path}`

  // In debug mode, include full request details
  if (currentLogLevel === 'debug') {
    const fullMetadata: Record<string, unknown> = { ...metadata }

    if (body !== undefined) {
      fullMetadata.body = sanitizeSensitiveData(body)
    }

    if (headers) {
      // Sanitize headers but keep most for debugging
      const sanitizedHeaders: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase()
        if (lowerKey === 'authorization' || lowerKey === 'cookie') {
          sanitizedHeaders[key] = '[SANITIZED]'
        } else {
          sanitizedHeaders[key] = value
        }
      }
      fullMetadata.headers = sanitizedHeaders
    }

    debug(message, fullMetadata)
  } else {
    // In non-debug mode, just log basic info
    debug(message, metadata)
  }
}

/**
 * Log an HTTP response with full details in debug mode
 *
 * @param method - HTTP method
 * @param path - Request path
 * @param statusCode - HTTP status code
 * @param metadata - Optional response metadata
 * @param body - Optional response body (included in debug mode)
 * @param duration - Optional request duration in milliseconds
 */
export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  metadata?: Record<string, unknown>,
  body?: unknown,
  duration?: number
): void {
  const message = `${method} ${path} - ${statusCode}`

  // In debug mode, include full response details
  if (currentLogLevel === 'debug') {
    const fullMetadata: Record<string, unknown> = { ...metadata }

    if (body !== undefined) {
      fullMetadata.body = sanitizeSensitiveData(body)
    }

    if (duration !== undefined) {
      fullMetadata.duration = `${duration}ms`
    }

    debug(message, fullMetadata)
  } else {
    // In non-debug mode, just log basic info
    const baseMetadata = { ...metadata }
    if (duration !== undefined) {
      baseMetadata.duration = `${duration}ms`
    }
    debug(message, baseMetadata)
  }
}

/**
 * Log error with full stack trace in debug mode
 *
 * @param error - The error to log
 * @param context - Optional context string
 */
export function logError(error: unknown, context?: string): void {
  const message = context || 'Error occurred'
  const metadata: Record<string, unknown> = {}

  if (error instanceof Error) {
    metadata.name = error.name
    metadata.message = error.message
    if (currentLogLevel === 'debug') {
      metadata.stack = error.stack
    }
  } else {
    metadata.error = String(error)
  }

  error(message, metadata)
}

/**
 * Initialize the logger with a default environment
 * Call this during application startup
 *
 * @param environment - The environment to initialize with
 */
export function initializeLogger(environment: Environment = 'prod'): void {
  setLogLevel(environment)
  info('Logger initialized', { environment, log_level: getEnvironmentConfig(environment).log_level })
}

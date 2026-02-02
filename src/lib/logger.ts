/**
 * Environment-Aware Logger
 *
 * Provides logging functionality that respects environment-specific log levels.
 * Dev and staging environments use debug level with full request/response logging.
 * Prod uses info level with sampled logging for performance.
 *
 * US-006: Implement Verbose Logging in Dev
 *
 * @module logger
 */

import type { Environment } from './environment'
import { setLogLevel, getCurrentLogLevel, type LogLevel } from './logger/config'
import { sanitizeSensitiveData, sanitizeHeaders } from './logger/formatters'
import { transportLog, transportWarn, transportError } from './logger/transports'

// Re-export commonly used types
export type { LogLevel } from './logger/config'

// Re-export API helpers for convenience
export { logApiRequest, logApiResponse, withLogging } from './logger/api-helpers'

/**
 * Log a debug message
 * Only logs if debug level is enabled
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function debug(message: string, metadata?: Record<string, unknown>): void {
  transportLog('debug', message, metadata)
}

/**
 * Log an info message
 * Only logs if info level or higher is enabled
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function info(message: string, metadata?: Record<string, unknown>): void {
  transportLog('info', message, metadata)
}

/**
 * Log a warning message
 * Always logged regardless of log level
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function warn(message: string, metadata?: Record<string, unknown>): void {
  transportWarn(message, metadata)
}

/**
 * Log an error message
 * Always logged regardless of log level
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function error(message: string, metadata?: Record<string, unknown>): void {
  transportError(message, metadata)
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
  if (getCurrentLogLevel() === 'debug') {
    const fullMetadata: Record<string, unknown> = { ...metadata }

    if (body !== undefined) {
      fullMetadata.body = sanitizeSensitiveData(body)
    }

    if (headers) {
      fullMetadata.headers = sanitizeHeaders(headers)
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
  if (getCurrentLogLevel() === 'debug') {
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
 * @param err - The error to log
 * @param context - Optional context string
 */
export function logError(err: unknown, context?: string): void {
  const message = context || 'Error occurred'
  const metadata: Record<string, unknown> = {}

  if (err instanceof Error) {
    metadata.name = err.name
    metadata.message = err.message
    if (getCurrentLogLevel() === 'debug') {
      metadata.stack = err.stack
    }
  } else {
    metadata.error = String(err)
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
  const { getEnvironmentConfig } = require('./environment')
  const config = getEnvironmentConfig(environment)
  setLogLevel(environment, config.log_level)
  info('Logger initialized', { environment, log_level: config.log_level })
}

/**
 * Set log level based on snapshot environment
 * Re-exported from config for convenience
 */
export { setLogLevelFromSnapshot } from './logger/config'

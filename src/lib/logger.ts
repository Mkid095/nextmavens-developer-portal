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
 * @param err - The error to log
 * @param context - Optional context string
 */
export function logError(err: unknown, context?: string): void {
  const message = context || 'Error occurred'
  const metadata: Record<string, unknown> = {}

  if (err instanceof Error) {
    metadata.name = err.name
    metadata.message = err.message
    if (currentLogLevel === 'debug') {
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
  setLogLevel(environment)
  info('Logger initialized', { environment, log_level: getEnvironmentConfig(environment).log_level })
}

/**
 * Set log level based on snapshot environment
 * Use this when you have a snapshot and want to configure logging accordingly
 *
 * @param snapshotEnvironment - Environment from snapshot ('production' | 'development' | 'staging')
 */
export function setLogLevelFromSnapshot(snapshotEnvironment: 'production' | 'development' | 'staging'): void {
  let environment: Environment = 'prod'

  switch (snapshotEnvironment) {
    case 'development':
      environment = 'dev'
      break
    case 'staging':
      environment = 'staging'
      break
    case 'production':
      environment = 'prod'
      break
  }

  setLogLevel(environment)
}

/**
 * Helper function to log API request with environment-aware verbosity
 * Call this at the start of your API route handler
 *
 * @param req - Next.js request object
 * @param projectId - Optional project ID to fetch environment for
 */
export async function logApiRequest(
  req: Request,
  projectId?: string
): Promise<void> {
  const url = new URL(req.url)
  const method = req.method

  // Clone request to read body without consuming it
  let body: unknown = undefined
  const contentType = req.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    try {
      const clonedReq = req.clone()
      body = await clonedReq.json()
    } catch {
      // Body not readable or not JSON
    }
  }

  // Get headers as object
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  logRequest(method, url.pathname, undefined, body, headers)
}

/**
 * Helper function to log API response with environment-aware verbosity
 * Call this before returning from your API route handler
 *
 * @param req - Next.js request object
 * @param response - Response object
 * @param duration - Request duration in milliseconds
 */
export function logApiResponse(
  req: Request,
  response: Response,
  duration: number
): void {
  const url = new URL(req.url)
  const method = req.method
  const status = response.status

  // Try to get response body
  let responseBody: unknown = undefined
  const contentType = response.headers.get('content-type')

  if (currentLogLevel === 'debug' && contentType?.includes('application/json')) {
    // Note: We can't read the response body without consuming it
    // This is a limitation of the Response API
    // Callers can optionally pass response body if they have it
  }

  logResponse(method, url.pathname, status, { duration }, undefined, duration)
}

/**
 * Higher-order function to wrap API route handlers with logging
 * Automatically logs request and response with environment-aware verbosity
 *
 * @param handler - The API route handler to wrap
 * @returns A wrapped handler with automatic logging
 *
 * @example
 * ```ts
 * import { withLogging } from '@/lib/logger'
 * import { NextRequest } from 'next/server'
 *
 * export const POST = withLogging(async (req: NextRequest) => {
 *   // Your handler logic here
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withLogging<T extends Request>(
  handler: (req: T) => Promise<Response> | Response
): (req: T) => Promise<Response> {
  return async (req: T): Promise<Response> => {
    const startTime = Date.now()

    // Log incoming request
    await logApiRequest(req)

    try {
      // Call the actual handler
      const response = await handler(req)
      const duration = Date.now() - startTime

      // Log outgoing response
      logApiResponse(req, response, duration)

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      logError(error, `Request failed: ${req.method} ${new URL(req.url).pathname}`)

      throw error
    }
  }
}

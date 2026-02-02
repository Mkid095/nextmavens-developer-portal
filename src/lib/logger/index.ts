/**
 * Logger Module
 *
 * Re-exports all logger functionality for convenient importing.
 *
 * @example
 * ```ts
 * import { debug, info, warn, error, createLogger } from '@/lib/logger'
 * ```
 */

// Main logger interface
export {
  debug,
  info,
  warn,
  error,
  createLogger,
  Logger,
  logRequest,
  logResponse,
  logError,
  initializeLogger,
  setLogLevelFromSnapshot,
} from '../logger'

// API helpers
export {
  logApiRequest,
  logApiResponse,
  withLogging,
} from './api-helpers'

// Types
export type { LogLevel } from '../logger'

// Config exports (if needed directly)
export {
  setLogLevel,
  getCurrentLogLevel,
  shouldLog,
  shouldSample,
  PRODUCTION_SAMPLE_RATE,
  LOG_LEVEL_PRIORITY,
} from './config'

// Formatter exports (if needed directly)
export {
  sanitizeSensitiveData,
  formatMetadata,
  formatLog,
  sanitizeHeaders,
} from './formatters'

// Transport exports (if needed directly)
export {
  transportLog,
  transportWarn,
  transportError,
} from './transports'

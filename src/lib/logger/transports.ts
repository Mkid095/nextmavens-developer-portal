/**
 * Log Transports
 *
 * Transport layer for outputting logs to different destinations.
 * Currently supports console output with environment-specific formatting.
 */

import type { LogLevel } from './config'
import { shouldLog, shouldSample } from './config'
import { formatLog } from './formatters'

/**
 * Output a log message to the appropriate transport
 *
 * @param level - The log level
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function transportLog(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
  if (shouldLog(level) && !shouldSample(level)) {
    const formattedMessage = formatLog(level, message, metadata)

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }
  }
}

/**
 * Output a warning message (warnings are never sampled)
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function transportWarn(message: string, metadata?: Record<string, unknown>): void {
  console.warn(formatLog('warn', message, metadata))
}

/**
 * Output an error message (errors are never sampled)
 *
 * @param message - The message to log
 * @param metadata - Optional metadata to include
 */
export function transportError(message: string, metadata?: Record<string, unknown>): void {
  console.error(formatLog('error', message, metadata))
}

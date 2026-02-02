/**
 * Logger Configuration
 *
 * Central configuration for the logger including log levels,
 * priorities, and environment-based settings.
 */

import type { Environment } from '../environment'

/**
 * Log levels in order of severity (lower = more verbose)
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log level priority (lower number = less severe)
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Sample rate for production logs (0-1)
 * In production, only log this fraction of info/debug logs to reduce noise
 */
export const PRODUCTION_SAMPLE_RATE = 0.1

/**
 * Current log level for the application
 * Can be overridden by setting environment-specific log level
 */
let currentLogLevel: LogLevel = 'info'

/**
 * Get the current log level
 */
export function getCurrentLogLevel(): LogLevel {
  return currentLogLevel
}

/**
 * Set the current log level based on environment
 *
 * @param environment - The environment to set log level for
 * @param logLevel - Optional explicit log level (if not provided, uses environment defaults)
 */
export function setLogLevel(environment: Environment, logLevel?: LogLevel): void {
  if (logLevel) {
    currentLogLevel = logLevel
  } else {
    // Default log levels by environment
    const envLogLevels: Record<Environment, LogLevel> = {
      prod: 'info',
      dev: 'debug',
      staging: 'debug',
    }
    currentLogLevel = envLogLevels[environment]
  }
}

/**
 * Check if a log should be output based on current log level
 *
 * @param level - The log level to check
 * @returns True if the log should be output
 */
export function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel]
}

/**
 * Check if production sampling should apply to this log
 *
 * @param level - The log level to check
 * @returns True if sampling should be applied
 */
export function shouldSample(level: LogLevel): boolean {
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

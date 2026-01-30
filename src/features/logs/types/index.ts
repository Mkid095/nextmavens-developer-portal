/**
 * Logs Feature Types
 *
 * Type definitions for the logs system.
 *
 * US-002: Create Logs WebSocket Endpoint
 */

/**
 * Supported service types for logs
 */
export type LogService = 'database' | 'auth' | 'realtime' | 'storage' | 'graphql'

/**
 * Log levels
 */
export type LogLevel = 'info' | 'warn' | 'error'

/**
 * Log entry interface
 */
export interface LogEntry {
  id: string
  project_id: string
  timestamp: string
  service: LogService
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
  created_at: string
}

/**
 * Log entry for API responses (excludes created_at)
 */
export interface LogEntryResponse {
  id: string
  timestamp: string
  service: LogService
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
}

/**
 * WebSocket message type for log streaming
 */
export interface LogStreamMessage {
  type: 'log' | 'error' | 'heartbeat'
  data?: LogEntryResponse
  error?: string
  timestamp?: string
}

/**
 * Query parameters for logs API
 */
export interface LogsQueryParams {
  project_id: string
  limit?: number
  offset?: number
  service?: LogService
  level?: LogLevel
  search?: string
  start_date?: string
  end_date?: string
}

/**
 * Logs API response
 */
export interface LogsApiResponse {
  logs: LogEntryResponse[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

/**
 * WebSocket connection parameters
 */
export interface LogStreamParams {
  project_id: string
  token: string
  service?: LogService
  level?: LogLevel
}

/**
 * Log write options
 */
export interface WriteLogOptions {
  project_id: string
  service: LogService
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
}

/**
 * Logs Feature
 *
 * Real-time log streaming and management for projects.
 *
 * US-002: Create Logs WebSocket Endpoint
 */

// Types
export type {
  LogEntry,
  LogEntryResponse,
  LogService,
  LogLevel,
  LogStreamMessage,
  LogsQueryParams,
  LogsApiResponse,
  LogStreamParams,
  WriteLogOptions,
} from './types'

// Migrations
export { createProjectLogsTable, dropProjectLogsTable } from './migrations/create-project-logs-table'

// Utilities
export {
  writeLog,
  logInfo,
  logWarn,
  logError,
} from './lib/write-log'

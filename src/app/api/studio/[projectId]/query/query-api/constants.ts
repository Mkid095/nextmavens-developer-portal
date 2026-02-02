/**
 * SQL Query API - Constants
 *
 * US-002: Create Execute Query API
 * US-007: Add Query Timeout
 * US-008: Show Query Stats
 * US-010: Enforce Database Write Permissions
 * US-011: Enforce Studio Permissions
 */

/**
 * Destructive SQL commands that modify data
 * Used to validate readonly mode
 */
export const DESTRUCTIVE_COMMANDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'RENAME',
  'GRANT',
  'REVOKE',
  'COMMENT',
] as const

/**
 * Write operation SQL commands
 */
export const WRITE_COMMANDS = ['INSERT', 'UPDATE', 'DELETE'] as const

/**
 * Default query timeout in milliseconds (30 seconds)
 */
export const DEFAULT_QUERY_TIMEOUT = 30000

/**
 * Minimum query timeout in milliseconds (1 second)
 */
export const MIN_QUERY_TIMEOUT = 1000

/**
 * Maximum query timeout in milliseconds (5 minutes)
 */
export const MAX_QUERY_TIMEOUT = 300000

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  REQUEST_TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Error codes
 */
export const ERROR_CODES = {
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const

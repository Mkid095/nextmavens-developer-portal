/**
 * Incident Route Module - Constants
 */

import type { ApiResponse } from './types'

/**
 * Valid incident statuses
 */
export const VALID_STATUSES = ['active', 'resolved', 'maintenance'] as const
export type IncidentStatus = typeof VALID_STATUSES[number]

/**
 * Valid impact levels
 */
export const VALID_IMPACTS = ['high', 'medium', 'low'] as const
export type ImpactLevel = typeof VALID_IMPACTS[number]

/**
 * Error codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_IMPACT: 'INVALID_IMPACT',
  NO_FIELDS: 'NO_FIELDS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NO_TOKEN: 'Authentication required',
  INVALID_TOKEN: 'Authentication required',
  INSUFFICIENT_PRIVILEGES: 'Insufficient privileges',
  INCIDENT_NOT_FOUND: 'Incident not found',
  INVALID_STATUS: (valid: string[]) =>
    `Invalid status. Must be one of: ${valid.join(', ')}`,
  INVALID_IMPACT: (valid: string[]) =>
    `Invalid impact. Must be one of: ${valid.join(', ')}`,
  NO_FIELDS: 'No fields to update',
  FAILED_TO_FETCH: 'Failed to fetch incident',
  FAILED_TO_UPDATE: 'Failed to update incident',
} as const

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const

/**
 * SQL queries
 */
export const SQL_QUERIES = {
  GET_DEVELOPER: 'SELECT id, email, name, organization FROM developers WHERE id = $1',

  GET_DEVELOPER_ROLE: 'SELECT role FROM developers WHERE id = $1',

  GET_INCIDENT: `SELECT id, service, status, title, description, impact,
                 started_at, resolved_at, affected_services, created_at
                 FROM control_plane.incidents
                 WHERE id = $1`,

  GET_INCIDENT_UPDATES: `SELECT id, message, status, created_at
                         FROM control_plane.incident_updates
                         WHERE incident_id = $1
                         ORDER BY created_at DESC`,

  UPDATE_INCIDENT: (fields: string, paramIndex: number) =>
    `UPDATE control_plane.incidents
     SET ${fields}
     WHERE id = $${paramIndex}
     RETURNING id, service, status, title, description, impact, started_at, resolved_at, affected_services, created_at`,
} as const

/**
 * Authorization roles
 */
export const AUTHORIZED_ROLES = ['operator', 'admin'] as const

/**
 * Log prefixes
 */
export const LOG_PREFIXES = {
  INCIDENT: '[Incident]',
  GET_ERROR: '[Incident] Error fetching incident:',
  UPDATE_ERROR: '[Incident] Error updating incident:',
} as const

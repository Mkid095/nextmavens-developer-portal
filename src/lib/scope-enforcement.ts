/**
 * Scope Enforcement for API Gateway
 *
 * Provides utilities for enforcing API key scopes at the gateway level.
 * This ensures that keys cannot exceed their permissions.
 *
 * US-007: MCP Scope Enforcement
 * - Gateway checks key type and scopes
 * - MCP tokens limited to their scopes
 * - Read-only tokens rejected for write operations
 * - Returns PERMISSION_DENIED with clear message
 */

import type { ApiKey, ApiKeyScope, ApiKeyService, ApiKeyType } from '@/lib/types/api-key.types'
import { getServiceFromScope } from '@/lib/types/api-key.types'

/**
 * Error types for scope enforcement failures.
 */
export enum ScopeErrorType {
  MISSING_SCOPE = 'MISSING_SCOPE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  KEY_REVOKED = 'KEY_REVOKED',
  MCP_WRITE_DENIED = 'MCP_WRITE_DENIED', // US-007: MCP read-only token denied write operation
}

/**
 * Scope enforcement error response.
 */
export interface ScopeErrorResponse {
  error: string
  code: ScopeErrorType
  required_scope?: ApiKeyScope
  service?: ApiKeyService
  message: string
}

/**
 * Required scopes for each service operation.
 *
 * Maps service operations to the required scope.
 */
export const REQUIRED_SCOPES: Record<string, ApiKeyScope> = {
  // Database operations
  'db:select': 'db:select',
  'db:insert': 'db:insert',
  'db:update': 'db:update',
  'db:delete': 'db:delete',

  // Storage operations
  'storage:read': 'storage:read',
  'storage:write': 'storage:write',

  // Auth operations
  'auth:signin': 'auth:signin',
  'auth:signup': 'auth:signup',
  'auth:manage': 'auth:manage',

  // Realtime operations
  'realtime:subscribe': 'realtime:subscribe',
  'realtime:publish': 'realtime:publish',

  // GraphQL operations
  'graphql:execute': 'graphql:execute',
}

/**
 * Check if an API key has the required scope for an operation.
 *
 * @param apiKey - The API key to check
 * @param operation - The operation being performed (e.g., 'db:select')
 * @returns true if the key has the required scope, false otherwise
 */
export function hasRequiredScope(apiKey: ApiKey, operation: string): boolean {
  const requiredScope = REQUIRED_SCOPES[operation]
  if (!requiredScope) {
    // If operation is not in the required scopes map, allow it
    // (this allows for future operations to be added without breaking existing keys)
    return true
  }

  return apiKey.scopes?.includes(requiredScope) ?? false
}

/**
 * Enforce scope requirements for an operation.
 *
 * Throws an error if the key doesn't have the required scope.
 * Use this in the gateway to check permissions before forwarding requests.
 *
 * @param apiKey - The API key to check
 * @param operation - The operation being performed (e.g., 'db:select')
 * @throws ScopeErrorResponse if the key doesn't have the required scope
 */
export function enforceScope(apiKey: ApiKey, operation: string): void {
  const requiredScope = REQUIRED_SCOPES[operation]

  if (!requiredScope) {
    // Operation not in required scopes map, allow it
    return
  }

  if (!apiKey.scopes?.includes(requiredScope)) {
    const service = getServiceFromScope(requiredScope)

    const error: ScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: ScopeErrorType.MISSING_SCOPE,
      required_scope: requiredScope,
      service,
      message: `Missing required scope: ${requiredScope}. This key does not have permission to perform this operation.`,
    }

    throw error
  }
}

/**
 * Check multiple required scopes (all must be present).
 *
 * @param apiKey - The API key to check
 * @param operations - Array of operations to check
 * @returns true if the key has all required scopes, false otherwise
 */
export function hasAllRequiredScopes(apiKey: ApiKey, operations: string[]): boolean {
  return operations.every(operation => hasRequiredScope(apiKey, operation))
}

/**
 * Check if key has any of the required scopes (at least one must be present).
 *
 * @param apiKey - The API key to check
 * @param operations - Array of operations to check
 * @returns true if the key has at least one of the required scopes
 */
export function hasAnyRequiredScope(apiKey: ApiKey, operations: string[]): boolean {
  return operations.some(operation => hasRequiredScope(apiKey, operation))
}

/**
 * Get missing scopes for a set of operations.
 *
 * @param apiKey - The API key to check
 * @param operations - Array of operations to check
 * @returns Array of missing scopes
 */
export function getMissingScopes(apiKey: ApiKey, operations: string[]): ApiKeyScope[] {
  const missing: ApiKeyScope[] = []

  for (const operation of operations) {
    const requiredScope = REQUIRED_SCOPES[operation]
    if (requiredScope && !apiKey.scopes?.includes(requiredScope)) {
      missing.push(requiredScope)
    }
  }

  return missing
}

/**
 * Log scope requirement check for audit trail.
 *
 * @param apiKey - The API key being checked
 * @param operation - The operation being performed
 * @param granted - Whether the permission was granted
 * @param metadata - Additional metadata to log
 */
export function logScopeCheck(
  apiKey: ApiKey,
  operation: string,
  granted: boolean,
  metadata?: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    key_id: apiKey.id,
    key_type: apiKey.key_type,
    operation,
    required_scope: REQUIRED_SCOPES[operation] || 'unknown',
    granted,
    ...metadata,
  }

  // Log to console for now (in production, this would go to the audit log)
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Scope Enforcement]', JSON.stringify(logEntry))
  }

  // TODO: Send to audit log service
  // await auditLogService.log('scope_check', logEntry)
}

/**
 * Gateway middleware for scope enforcement.
 *
 * Use this in the API Gateway to automatically enforce scopes.
 *
 * @param apiKey - The API key from the request
 * @param operation - The operation being performed
 * @returns NextResponse with error if scope check fails, null if passes
 */
export function gatewayScopeEnforcement(
  apiKey: ApiKey,
  operation: string
): { error: ScopeErrorResponse } | null {
  try {
    enforceScope(apiKey, operation)

    // Log successful scope check
    logScopeCheck(apiKey, operation, true)

    return null
  } catch (error) {
    const scopeError = error as ScopeErrorResponse

    // Log failed scope check
    logScopeCheck(apiKey, operation, false, { reason: scopeError.message })

    return { error: scopeError }
  }
}

/**
 * Service-level scope check.
 *
 * Checks if a key has any scope for a specific service.
 *
 * @param apiKey - The API key to check
 * @param service - The service to check (e.g., 'db', 'storage')
 * @returns true if the key has any scopes for the service
 */
export function hasServiceScope(apiKey: ApiKey, service: ApiKeyService): boolean {
  return apiKey.scopes?.some(scope => scope.startsWith(`${service}:`)) ?? false
}

/**
 * US-007: Check if an API key is an MCP token.
 *
 * @param apiKey - The API key to check
 * @returns true if the key is an MCP token
 */
export function isMcpToken(apiKey: ApiKey): boolean {
  return apiKey.key_type === 'mcp'
}

/**
 * US-007: Check if an API key is an MCP read-only token.
 *
 * Read-only MCP tokens have scopes: db:select, storage:read, realtime:subscribe
 * They do NOT have: db:insert, db:update, db:delete, storage:write, realtime:publish, graphql:execute, auth:manage
 *
 * @param apiKey - The API key to check
 * @returns true if the key is an MCP read-only token
 */
export function isMcpReadOnlyToken(apiKey: ApiKey): boolean {
  if (!isMcpToken(apiKey)) {
    return false
  }

  // Check if the token has ONLY read-only scopes
  const readOnlyScopes: ApiKeyScope[] = ['db:select', 'storage:read', 'realtime:subscribe']
  const writeScopes: ApiKeyScope[] = [
    'db:insert',
    'db:update',
    'db:delete',
    'storage:write',
    'realtime:publish',
    'graphql:execute',
    'auth:manage',
    'auth:signin',
    'auth:signup',
  ]

  const scopes = apiKey.scopes || []

  // Must have at least one read-only scope
  const hasReadOnlyScope = scopes.some(scope => readOnlyScopes.includes(scope))

  // Must NOT have any write scopes
  const hasWriteScope = scopes.some(scope => writeScopes.includes(scope))

  return hasReadOnlyScope && !hasWriteScope
}

/**
 * US-007: Check if an operation is a write operation.
 *
 * Write operations are: db:insert, db:update, db:delete, storage:write, realtime:publish, graphql:execute, auth:manage
 *
 * @param operation - The operation to check
 * @returns true if the operation is a write operation
 */
export function isWriteOperation(operation: string): boolean {
  const writeOperations: string[] = [
    'db:insert',
    'db:update',
    'db:delete',
    'storage:write',
    'realtime:publish',
    'graphql:execute',
    'auth:manage',
    'auth:signup',
  ]
  return writeOperations.includes(operation)
}

/**
 * US-007: Enforce MCP scope restrictions.
 *
 * MCP read-only tokens are rejected for write operations with a clear error message.
 *
 * @param apiKey - The API key to check
 * @param operation - The operation being performed
 * @throws ScopeErrorResponse if MCP read-only token attempts write operation
 */
export function enforceMcpScopeRestrictions(apiKey: ApiKey, operation: string): void {
  // Only enforce for MCP tokens
  if (!isMcpToken(apiKey)) {
    return
  }

  // Check if this is a write operation
  if (!isWriteOperation(operation)) {
    return
  }

  // Check if the token is read-only
  if (isMcpReadOnlyToken(apiKey)) {
    const error: ScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: ScopeErrorType.MCP_WRITE_DENIED,
      required_scope: REQUIRED_SCOPES[operation] as ApiKeyScope,
      service: getServiceFromScope(REQUIRED_SCOPES[operation] as ApiKeyScope),
      message: `MCP read-only token cannot perform write operations. This token has read-only access and cannot execute: ${operation}. To perform write operations, use an MCP write token (mcp_rw_) or admin token (mcp_admin_).`,
    }

    throw error
  }

  // For MCP write/admin tokens, proceed with normal scope enforcement
  // (they still need to have the required scope in their scopes array)
}

/**
 * US-007: Enhanced scope enforcement that includes MCP restrictions.
 *
 * This function combines regular scope enforcement with MCP-specific restrictions.
 * It should be used in the API Gateway to enforce both general and MCP-specific scope rules.
 *
 * @param apiKey - The API key to check
 * @param operation - The operation being performed
 * @throws ScopeErrorResponse if scope check fails
 */
export function enforceScopeWithMcpRestrictions(apiKey: ApiKey, operation: string): void {
  // First, enforce MCP-specific restrictions
  enforceMcpScopeRestrictions(apiKey, operation)

  // Then, enforce regular scope requirements
  enforceScope(apiKey, operation)
}

/**
 * US-007: Gateway middleware for MCP scope enforcement.
 *
 * Use this in the API Gateway to automatically enforce MCP scope restrictions.
 * Returns null if the check passes, or an error object if it fails.
 *
 * @param apiKey - The API key from the request
 * @param operation - The operation being performed
 * @returns NextResponse with error if scope check fails, null if passes
 */
export function gatewayMcpScopeEnforcement(
  apiKey: ApiKey,
  operation: string
): { error: ScopeErrorResponse } | null {
  try {
    enforceScopeWithMcpRestrictions(apiKey, operation)

    // Log successful scope check
    logScopeCheck(apiKey, operation, true, { mcp_token: isMcpToken(apiKey) })

    return null
  } catch (error) {
    const scopeError = error as ScopeErrorResponse

    // Log failed scope check
    logScopeCheck(apiKey, operation, false, {
      reason: scopeError.message,
      mcp_token: isMcpToken(apiKey),
      mcp_read_only: isMcpReadOnlyToken(apiKey),
    })

    return { error: scopeError }
  }
}

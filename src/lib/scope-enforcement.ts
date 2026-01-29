/**
 * Scope Enforcement for API Gateway
 *
 * Provides utilities for enforcing API key scopes at the gateway level.
 * This ensures that keys cannot exceed their permissions.
 */

import type { ApiKey, ApiKeyScope, ApiKeyService } from '@/lib/types/api-key.types'
import { getServiceFromScope } from '@/lib/types/api-key.types'

/**
 * Error types for scope enforcement failures.
 */
export enum ScopeErrorType {
  MISSING_SCOPE = 'MISSING_SCOPE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  KEY_REVOKED = 'KEY_REVOKED',
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

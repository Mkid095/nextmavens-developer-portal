/**
 * MCP Scope Enforcement for API Gateway
 *
 * Provides utilities for enforcing MCP token scopes at the gateway level.
 * Ensures that MCP tokens cannot exceed their defined permissions.
 *
 * US-007: Implement MCP Scope Enforcement
 * - Gateway checks key type and scopes
 * - MCP tokens limited to their scopes
 * - Read-only tokens rejected for write operations
 * - Returns PERMISSION_DENIED with clear message
 */

import type { ApiKey, ApiKeyScope, ApiKeyType, McpAccessLevel } from '@/lib/types/api-key.types'
import {
  enforceScope,
  gatewayScopeEnforcement,
  type ScopeErrorResponse,
  ScopeErrorType,
} from '@/lib/scope-enforcement'
import { getMcpDefaultScopes } from '@/lib/types/api-key.types'

/**
 * Write operations that require more than read-only access
 */
const WRITE_OPERATIONS: ApiKeyScope[] = [
  'db:insert',
  'db:update',
  'db:delete',
  'storage:write',
  'auth:manage',
  'realtime:publish',
]

/**
 * Read-only operations
 */
const READ_ONLY_OPERATIONS: ApiKeyScope[] = [
  'db:select',
  'storage:read',
  'realtime:subscribe',
]

/**
 * Admin-only operations
 */
const ADMIN_OPERATIONS: ApiKeyScope[] = [
  'db:delete',
  'auth:manage',
  'realtime:publish',
]

/**
 * Get the MCP access level from an API key
 */
export function getMcpAccessLevel(apiKey: ApiKey): McpAccessLevel | null {
  if (apiKey.key_type !== 'mcp') {
    return null
  }

  const prefix = apiKey.key_prefix
  if (prefix.startsWith('mcp_ro_')) {
    return 'ro'
  } else if (prefix.startsWith('mcp_rw_')) {
    return 'rw'
  } else if (prefix.startsWith('mcp_admin_')) {
    return 'admin'
  }

  return null
}

/**
 * Check if an MCP token is read-only
 */
export function isMcpReadOnly(apiKey: ApiKey): boolean {
  return apiKey.key_type === 'mcp' && apiKey.key_prefix.startsWith('mcp_ro_')
}

/**
 * Check if an MCP token has write access
 */
export function mcpHasWriteAccess(apiKey: ApiKey): boolean {
  if (apiKey.key_type !== 'mcp') {
    return false
  }

  const accessLevel = getMcpAccessLevel(apiKey)
  return accessLevel === 'rw' || accessLevel === 'admin'
}

/**
 * Check if an MCP token has admin access
 */
export function mcpHasAdminAccess(apiKey: ApiKey): boolean {
  if (apiKey.key_type !== 'mcp') {
    return false
  }

  return getMcpAccessLevel(apiKey) === 'admin'
}

/**
 * Validate MCP token scopes match their access level
 * This ensures the token's scopes are consistent with its prefix
 */
export function validateMcpScopes(apiKey: ApiKey): { valid: boolean; error?: string } {
  if (apiKey.key_type !== 'mcp') {
    return { valid: true }
  }

  const accessLevel = getMcpAccessLevel(apiKey)
  if (!accessLevel) {
    return {
      valid: false,
      error: 'Invalid MCP token prefix. Expected mcp_ro_, mcp_rw_, or mcp_admin_',
    }
  }

  const expectedScopes = new Set(getMcpDefaultScopes(accessLevel))
  const actualScopes = new Set(apiKey.scopes || [])

  // Check if actual scopes match expected scopes
  const missingScopes = [...expectedScopes].filter((s) => !actualScopes.has(s))
  const extraScopes = [...actualScopes].filter((s) => !expectedScopes.has(s))

  if (missingScopes.length > 0 || extraScopes.length > 0) {
    return {
      valid: false,
      error: `MCP token scopes do not match access level ${accessLevel}. ` +
        `Missing: ${missingScopes.join(', ') || 'none'}. ` +
        `Unexpected: ${extraScopes.join(', ') || 'none'}`,
    }
  }

  return { valid: true }
}

/**
 * MCP scope enforcement error with additional context
 */
export interface McpScopeErrorResponse extends ScopeErrorResponse {
  key_type?: ApiKeyType
  key_prefix?: string
  mcp_access_level?: McpAccessLevel
  operation_type?: 'read' | 'write' | 'admin'
}

/**
 * Enforce MCP scope requirements for an operation
 *
 * This function performs additional checks on top of the standard scope enforcement:
 * 1. Validates the MCP token type and prefix
 * 2. Checks if the operation is allowed for the MCP access level
 * 3. Returns a clear error message when access is denied
 *
 * @param apiKey - The API key to check (must be an MCP token)
 * @param operation - The operation being performed (e.g., 'db:select')
 * @throws McpScopeErrorResponse if the MCP token doesn't have permission
 */
export function enforceMcpScope(apiKey: ApiKey, operation: string): void {
  // First, validate that this is an MCP token
  if (apiKey.key_type !== 'mcp') {
    // Not an MCP token, use standard scope enforcement
    return enforceScope(apiKey, operation)
  }

  // Validate MCP token prefix and scopes
  const scopeValidation = validateMcpScopes(apiKey)
  if (!scopeValidation.valid) {
    const error: McpScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: ScopeErrorType.MISSING_SCOPE,
      message: scopeValidation.error!,
      key_type: apiKey.key_type,
      key_prefix: apiKey.key_prefix,
    }
    throw error
  }

  // Check if the operation is a write operation
  const isWriteOperation = WRITE_OPERATIONS.some((writeOp) => operation === writeOp)
  const isAdminOperation = ADMIN_OPERATIONS.some((adminOp) => operation === adminOp)

  const accessLevel = getMcpAccessLevel(apiKey)

  if (isWriteOperation && accessLevel === 'ro') {
    // Read-only token attempting write operation
    const error: McpScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: ScopeErrorType.MISSING_SCOPE,
      required_scope: operation as ApiKeyScope,
      message: `This MCP read-only token does not have permission to perform write operations. ` +
        `The operation '${operation}' requires a read-write (mcp_rw_) or admin (mcp_admin_) token. ` +
        `Read-only tokens can only perform: ${READ_ONLY_OPERATIONS.join(', ')}.`,
      key_type: apiKey.key_type,
      key_prefix: apiKey.key_prefix,
      mcp_access_level: accessLevel,
      operation_type: 'write',
    }
    throw error
  }

  if (isAdminOperation && accessLevel !== 'admin') {
    // Non-admin token attempting admin operation
    const error: McpScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: ScopeErrorType.MISSING_SCOPE,
      required_scope: operation as ApiKeyScope,
      message: `This MCP token does not have permission to perform administrative operations. ` +
        `The operation '${operation}' requires an admin (mcp_admin_) token. ` +
        `Your token has access level: ${accessLevel}.`,
      key_type: apiKey.key_type,
      key_prefix: apiKey.key_prefix,
      mcp_access_level: accessLevel,
      operation_type: 'admin',
    }
    throw error
  }

  // Use standard scope enforcement for the final check
  enforceScope(apiKey, operation)
}

/**
 * Gateway middleware for MCP scope enforcement
 *
 * Use this in the API Gateway to automatically enforce MCP scopes.
 * Returns an error response if scope check fails, null if passes.
 *
 * @param apiKey - The API key from the request
 * @param operation - The operation being performed
 * @returns Object with error if scope check fails, null if passes
 */
export function gatewayMcpScopeEnforcement(
  apiKey: ApiKey,
  operation: string
): { error: McpScopeErrorResponse } | null {
  try {
    enforceMcpScope(apiKey, operation)
    return null
  } catch (error) {
    const scopeError = error as McpScopeErrorResponse
    return { error: scopeError }
  }
}

/**
 * Create a permission denied error response for MCP tokens
 *
 * @param operation - The operation that was denied
 * @param apiKey - The API key that was denied
 * @returns Error response object
 */
export function createMcpPermissionDeniedError(
  operation: string,
  apiKey: ApiKey
): McpScopeErrorResponse {
  const accessLevel = getMcpAccessLevel(apiKey)
  const isWriteOperation = WRITE_OPERATIONS.some((writeOp) => operation === writeOp)

  return {
    error: 'PERMISSION_DENIED',
    code: ScopeErrorType.MISSING_SCOPE,
    required_scope: operation as ApiKeyScope,
    message: isWriteOperation && accessLevel === 'ro'
      ? `This MCP read-only token cannot perform write operations. ` +
        `Operation '${operation}' requires a read-write (mcp_rw_) or admin (mcp_admin_) token.`
      : `This MCP token does not have permission to perform '${operation}'. ` +
        `Token type: ${apiKey.key_type}, Prefix: ${apiKey.key_prefix}`,
    key_type: apiKey.key_type,
    key_prefix: apiKey.key_prefix,
    mcp_access_level: accessLevel || undefined,
  }
}

/**
 * Check if an operation requires write access
 */
export function requiresWriteAccess(operation: string): boolean {
  return WRITE_OPERATIONS.some((writeOp) => operation === writeOp)
}

/**
 * Check if an operation requires admin access
 */
export function requiresAdminAccess(operation: string): boolean {
  return ADMIN_OPERATIONS.some((adminOp) => operation === adminOp)
}

/**
 * Get all allowed operations for an MCP access level
 */
export function getAllowedOperationsForMcpLevel(
  accessLevel: McpAccessLevel
): ApiKeyScope[] {
  return getMcpDefaultScopes(accessLevel)
}

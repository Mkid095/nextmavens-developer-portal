/**
 * Scope Enforcement MCP
 * MCP-specific scope restrictions
 */

import type { ApiKey } from '@/lib/types/api-key.types'
import type { ApiKeyScope } from '@/lib/types/api-key.types'
import { getServiceFromScope } from '@/lib/types/api-key.types'
import { REQUIRED_SCOPES, WRITE_OPERATIONS, AUTH_OPERATIONS, READ_ONLY_SCOPES } from './constants'
import type { ScopeErrorResponse } from './types'

export function isMcpToken(apiKey: ApiKey): boolean {
  return apiKey.key_type === 'mcp'
}

export function isMcpReadOnlyToken(apiKey: ApiKey): boolean {
  if (!isMcpToken(apiKey)) return false

  const scopes = apiKey.scopes || []
  const hasReadOnlyScope = scopes.some(scope => READ_ONLY_SCOPES.includes(scope))
  const hasWriteScope = scopes.some(scope => WRITE_OPERATIONS.some(op => scope === op))

  return hasReadOnlyScope && !hasWriteScope
}

export function isWriteOperation(operation: string): boolean {
  return WRITE_OPERATIONS.includes(operation)
}

function isAuthOperation(operation: string): boolean {
  return AUTH_OPERATIONS.includes(operation)
}

function getMcpAccessLevelFromPrefix(apiKey: ApiKey): 'ro' | 'rw' | 'admin' | null {
  if (!isMcpToken(apiKey)) return null

  const prefix = apiKey.key_prefix
  if (prefix.startsWith('mcp_ro_')) return 'ro'
  if (prefix.startsWith('mcp_rw_')) return 'rw'
  if (prefix.startsWith('mcp_admin_')) return 'admin'

  return null
}

export function enforceMcpScopeRestrictions(apiKey: ApiKey, operation: string): void {
  if (!isMcpToken(apiKey)) return

  const accessLevel = getMcpAccessLevelFromPrefix(apiKey)

  if (isAuthOperation(operation)) {
    if (accessLevel !== 'admin') {
      const error: ScopeErrorResponse = {
        error: 'PERMISSION_DENIED',
        code: 'MCP_AUTH_DENIED' as any,
        required_scope: REQUIRED_SCOPES[operation] as ApiKeyScope,
        service: 'auth',
        message: `MCP ${accessLevel || ''} token cannot perform auth operations. User management is restricted to MCP admin tokens (mcp_admin_) only. This token cannot execute: ${operation}.`,
      }
      throw error
    }
    return
  }

  if (!isWriteOperation(operation)) return

  if (isMcpReadOnlyToken(apiKey)) {
    const error: ScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: 'MCP_WRITE_DENIED' as any,
      required_scope: REQUIRED_SCOPES[operation] as ApiKeyScope,
      service: getServiceFromScope(REQUIRED_SCOPES[operation] as ApiKeyScope),
      message: `MCP read-only token cannot perform write operations. This token has read-only access and cannot execute: ${operation}. To perform write operations, use an MCP write token (mcp_rw_) or admin token (mcp_admin_).`,
    }
    throw error
  }
}

export function enforceScopeWithMcpRestrictions(apiKey: ApiKey, operation: string): void {
  enforceMcpScopeRestrictions(apiKey, operation)
  const { enforceScope: enforce } = require('./validation')
  enforce(apiKey, operation)
}

export function gatewayMcpScopeEnforcement(
  apiKey: ApiKey,
  operation: string
): { error: ScopeErrorResponse } | null {
  try {
    enforceScopeWithMcpRestrictions(apiKey, operation)
    const { logScopeCheck } = require('./validation')
    logScopeCheck(apiKey, operation, true, { mcp_token: isMcpToken(apiKey) })
    return null
  } catch (error) {
    const scopeError = error as ScopeErrorResponse
    const { logScopeCheck } = require('./validation')
    logScopeCheck(apiKey, operation, false, {
      reason: scopeError.message,
      mcp_token: isMcpToken(apiKey),
      mcp_read_only: isMcpReadOnlyToken(apiKey),
    })
    return { error: scopeError }
  }
}

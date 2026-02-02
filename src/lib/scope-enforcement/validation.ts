/**
 * Scope Enforcement Validation
 */

import type { ApiKey } from '@/lib/types/api-key.types'
import type { ApiKeyScope, ApiKeyService } from '@/lib/types/api-key.types'
import { getServiceFromScope } from '@/lib/types/api-key.types'
import { REQUIRED_SCOPES } from './constants'
import type { ScopeErrorResponse } from './types'

export function hasRequiredScope(apiKey: ApiKey, operation: string): boolean {
  const requiredScope = REQUIRED_SCOPES[operation]
  if (!requiredScope) return true
  return apiKey.scopes?.includes(requiredScope) ?? false
}

export function enforceScope(apiKey: ApiKey, operation: string): void {
  const requiredScope = REQUIRED_SCOPES[operation]
  if (!requiredScope) return

  if (!apiKey.scopes?.includes(requiredScope)) {
    const service = getServiceFromScope(requiredScope)
    const error: ScopeErrorResponse = {
      error: 'PERMISSION_DENIED',
      code: 'MISSING_SCOPE' as any,
      required_scope: requiredScope,
      service,
      message: `Missing required scope: ${requiredScope}. This key does not have permission to perform this operation.`,
    }
    throw error
  }
}

export function hasAllRequiredScopes(apiKey: ApiKey, operations: string[]): boolean {
  return operations.every(operation => hasRequiredScope(apiKey, operation))
}

export function hasAnyRequiredScope(apiKey: ApiKey, operations: string[]): boolean {
  return operations.some(operation => hasRequiredScope(apiKey, operation))
}

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

export function hasServiceScope(apiKey: ApiKey, service: ApiKeyService): boolean {
  return apiKey.scopes?.some(scope => scope.startsWith(`${service}:`)) ?? false
}

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

  if (process.env.NODE_ENV === 'development') {
    console.debug('[Scope Enforcement]', JSON.stringify(logEntry))
  }
}

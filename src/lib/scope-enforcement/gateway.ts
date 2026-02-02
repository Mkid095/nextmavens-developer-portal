/**
 * Scope Enforcement Gateway
 */

import type { ApiKey } from '@/lib/types/api-key.types'
import { enforceScope } from './validation'
import { logScopeCheck } from './validation'
import type { ScopeErrorResponse } from './types'

export function gatewayScopeEnforcement(
  apiKey: ApiKey,
  operation: string
): { error: ScopeErrorResponse } | null {
  try {
    enforceScope(apiKey, operation)
    logScopeCheck(apiKey, operation, true)
    return null
  } catch (error) {
    const scopeError = error as ScopeErrorResponse
    logScopeCheck(apiKey, operation, false, { reason: scopeError.message })
    return { error: scopeError }
  }
}

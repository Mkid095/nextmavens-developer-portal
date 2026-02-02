/**
 * Scope Enforcement Types
 */

import type { ApiKeyScope } from '@/lib/types/api-key.types'
import type { ApiKeyService } from '@/lib/types/api-key.types'
import { ScopeErrorType } from './constants'

export interface ScopeErrorResponse {
  error: string
  code: ScopeErrorType
  required_scope?: ApiKeyScope
  service?: ApiKeyService
  message: string
}

export interface ScopeEnforcementResult {
  error?: ScopeErrorResponse
}

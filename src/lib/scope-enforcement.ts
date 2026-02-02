/**
 * Scope Enforcement for API Gateway
 *
 * Provides utilities for enforcing API key scopes at the gateway level.
 * Ensures that keys cannot exceed their permissions.
 *
 * US-007: MCP Scope Enforcement
 */

export {
  ScopeErrorType,
  REQUIRED_SCOPES,
  WRITE_OPERATIONS,
  AUTH_OPERATIONS,
  READ_ONLY_SCOPES,
} from './scope-enforcement/constants'

export type { ScopeErrorResponse, ScopeEnforcementResult } from './scope-enforcement/types'

export {
  hasRequiredScope,
  enforceScope,
  hasAllRequiredScopes,
  hasAnyRequiredScope,
  getMissingScopes,
  hasServiceScope,
  logScopeCheck,
} from './scope-enforcement/validation'

export { gatewayScopeEnforcement } from './scope-enforcement/gateway'

export {
  isMcpToken,
  isMcpReadOnlyToken,
  isWriteOperation,
  enforceMcpScopeRestrictions,
  enforceScopeWithMcpRestrictions,
  gatewayMcpScopeEnforcement,
} from './scope-enforcement/mcp'

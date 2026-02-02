/**
 * Scope Enforcement Constants
 */

import type { ApiKeyScope } from '@/lib/types/api-key.types'

export enum ScopeErrorType {
  MISSING_SCOPE = 'MISSING_SCOPE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  KEY_REVOKED = 'KEY_REVOKED',
  MCP_WRITE_DENIED = 'MCP_WRITE_DENIED',
  MCP_AUTH_DENIED = 'MCP_AUTH_DENIED',
}

export const REQUIRED_SCOPES: Record<string, ApiKeyScope> = {
  'db:select': 'db:select',
  'db:insert': 'db:insert',
  'db:update': 'db:update',
  'db:delete': 'db:delete',
  'storage:read': 'storage:read',
  'storage:write': 'storage:write',
  'auth:signin': 'auth:signin',
  'auth:signup': 'auth:signup',
  'auth:manage': 'auth:manage',
  'realtime:subscribe': 'realtime:subscribe',
  'realtime:publish': 'realtime:publish',
  'graphql:execute': 'graphql:execute',
}

export const WRITE_OPERATIONS: string[] = [
  'db:insert',
  'db:update',
  'db:delete',
  'storage:write',
  'realtime:publish',
  'graphql:execute',
  'auth:manage',
  'auth:signup',
]

export const AUTH_OPERATIONS: string[] = ['auth:manage', 'auth:signin', 'auth:signup']

export const READ_ONLY_SCOPES: ApiKeyScope[] = ['db:select', 'storage:read', 'realtime:subscribe']

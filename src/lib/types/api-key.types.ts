/**
 * API Key Type Definitions
 *
 * Defines the types and interfaces for the enhanced API key system.
 */

/**
 * The type of API key, determining its permissions and use case.
 */
export type ApiKeyType = 'public' | 'secret' | 'service_role' | 'mcp'

/**
 * MCP token access level for granular permissions.
 */
export type McpAccessLevel = 'ro' | 'rw' | 'admin'

/**
 * The environment the key is intended for.
 * Aligned with project environment types for consistency.
 */
export type ApiKeyEnvironment = 'prod' | 'dev' | 'staging'

/**
 * Granular permission scopes for API keys.
 * Format: service:action (e.g., db:select, storage:read)
 */
export type ApiKeyScope =
  | 'db:select'
  | 'db:insert'
  | 'db:update'
  | 'db:delete'
  | 'storage:read'
  | 'storage:write'
  | 'auth:signin'
  | 'auth:signup'
  | 'auth:manage'
  | 'realtime:subscribe'
  | 'realtime:publish'
  | 'graphql:execute'

/**
 * Service type for grouping scopes.
 */
export type ApiKeyService = 'db' | 'storage' | 'auth' | 'realtime' | 'graphql'

/**
 * API Key interface representing a key in the database.
 */
export interface ApiKey {
  id: string
  name: string
  key_type: ApiKeyType
  key_prefix: string
  public_key?: string
  scopes?: ApiKeyScope[]
  environment?: ApiKeyEnvironment
  created_at: string
  last_used?: string
  expires_at?: string
  rotated_to?: string
  usage_count?: number
}

/**
 * Scopes grouped by service for easier validation and display.
 */
export const SCOPES_BY_SERVICE: Record<ApiKeyService, ApiKeyScope[]> = {
  db: ['db:select', 'db:insert', 'db:update', 'db:delete'],
  storage: ['storage:read', 'storage:write'],
  auth: ['auth:signin', 'auth:signup', 'auth:manage'],
  realtime: ['realtime:subscribe', 'realtime:publish'],
  graphql: ['graphql:execute'],
}

/**
 * Get all scopes for a specific service.
 */
export function getScopesForService(service: ApiKeyService): ApiKeyScope[] {
  return SCOPES_BY_SERVICE[service]
}

/**
 * Check if a scope string is valid.
 */
export function isValidScope(scope: string): scope is ApiKeyScope {
  return Object.values(SCOPES_BY_SERVICE).flat().includes(scope as ApiKeyScope)
}

/**
 * Extract service from a scope string.
 */
export function getServiceFromScope(scope: ApiKeyScope): ApiKeyService {
  return scope.split(':')[0] as ApiKeyService
}

/**
 * Check if a key has permission for a specific scope.
 */
export function hasScope(key: ApiKey, requiredScope: ApiKeyScope): boolean {
  return key.scopes?.includes(requiredScope) ?? false
}

/**
 * Check if a key has any of the required scopes.
 */
export function hasAnyScope(key: ApiKey, requiredScopes: ApiKeyScope[]): boolean {
  return requiredScopes.some(scope => hasScope(key, scope))
}

/**
 * Response when creating a new API key.
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey
  secretKey?: string
}

/**
 * Default scopes for each key type.
 * For MCP tokens, scopes are defined per access level (ro, rw, admin).
 *
 * US-002: MCP tokens default to read-only for safe default behavior.
 * - mcp_ro: db:select, storage:read, realtime:subscribe (no auth, no graphql)
 * - mcp_rw: All ro scopes plus db:insert, db:update, storage:write, graphql:execute
 * - mcp_admin: All rw scopes plus db:delete, realtime:publish, auth:manage
 */
export const DEFAULT_SCOPES: Record<string, ApiKeyScope[]> = {
  public: ['db:select', 'storage:read', 'auth:signin', 'realtime:subscribe'],
  secret: [
    'db:select',
    'db:insert',
    'db:update',
    'db:delete',
    'storage:read',
    'storage:write',
    'auth:manage',
    'graphql:execute',
  ],
  service_role: [
    'db:select',
    'db:insert',
    'db:update',
    'db:delete',
    'storage:read',
    'storage:write',
    'auth:manage',
    'graphql:execute',
    'realtime:subscribe',
    'realtime:publish',
  ],
  // MCP default scopes per access level
  mcp_ro: ['db:select', 'storage:read', 'realtime:subscribe'],
  mcp_rw: [
    'db:select',
    'db:insert',
    'db:update',
    'storage:read',
    'storage:write',
    'realtime:subscribe',
    'graphql:execute',
  ],
  mcp_admin: [
    'db:select',
    'db:insert',
    'db:update',
    'db:delete',
    'storage:read',
    'storage:write',
    'realtime:subscribe',
    'realtime:publish',
    'graphql:execute',
    'auth:manage',
  ],
}

/**
 * Get default scopes for an MCP token based on its access level.
 * @param mcpAccessLevel - The MCP access level (ro, rw, admin)
 * @returns Array of default scopes for the specified access level
 */
export function getMcpDefaultScopes(mcpAccessLevel: McpAccessLevel): ApiKeyScope[] {
  return DEFAULT_SCOPES[`mcp_${mcpAccessLevel}`] || DEFAULT_SCOPES.mcp_ro
}

/**
 * Key prefix format for each key type and environment.
 *
 * Public keys: pk_prod_, pk_dev_, pk_staging_
 * Secret keys: sk_prod_, sk_dev_, sk_staging_
 * Service role: sr_prod_, sr_dev_, sr_staging_
 * MCP tokens: mcp_ro_, mcp_rw_, mcp_admin_
 *
 * @param keyType - The type of API key
 * @param environment - The environment (prod, dev, staging)
 * @param mcpAccessLevel - The MCP access level (ro, rw, admin) - only used for MCP keys
 * @returns The key prefix string
 */
export function getKeyPrefix(
  keyType: ApiKeyType,
  environment: ApiKeyEnvironment = 'prod',
  mcpAccessLevel?: McpAccessLevel
): string {
  if (keyType === 'mcp') {
    const level = mcpAccessLevel || 'ro'
    return `mcp_${level}_`
  }

  const typePrefix = {
    public: 'pk',
    secret: 'sk',
    service_role: 'sr',
  }[keyType]

  const envSuffix = {
    prod: '_prod_',
    dev: '_dev_',
    staging: '_staging_',
  }[environment]

  return `${typePrefix}${envSuffix}`
}

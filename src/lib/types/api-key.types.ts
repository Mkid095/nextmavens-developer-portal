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
 */
export type ApiKeyEnvironment = 'live' | 'test' | 'dev'

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
 */
export const DEFAULT_SCOPES: Record<ApiKey, ApiKeyScope[]> = {
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
  mcp: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'graphql:execute'],
}

/**
 * Key prefix format for each key type and environment.
 *
 * Public keys: pk_live_, pk_test_, pk_dev_
 * Secret keys: sk_live_, sk_test_, sk_dev_
 * Service role: sr_live_, sr_test_, sr_dev_
 * MCP tokens: mcp_ro_, mcp_rw_, mcp_admin_
 *
 * @param keyType - The type of API key
 * @param environment - The environment (live, test, dev)
 * @param mcpAccessLevel - The MCP access level (ro, rw, admin) - only used for MCP keys
 * @returns The key prefix string
 */
export function getKeyPrefix(
  keyType: ApiKeyType,
  environment: ApiKeyEnvironment = 'live',
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
    live: '_live_',
    test: '_test_',
    dev: '_dev_',
  }[environment]

  return `${typePrefix}${envSuffix}`
}

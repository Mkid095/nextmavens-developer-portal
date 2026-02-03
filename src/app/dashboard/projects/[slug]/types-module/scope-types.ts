/**
 * Project Types Module - Scope Configuration
 */

/**
 * Scopes grouped by service
 */
export const SCOPES_BY_SERVICE: Record<string, string[]> = {
  'Database (db)': ['db:select', 'db:insert', 'db:update', 'db:delete'],
  'Storage': ['storage:read', 'storage:write'],
  'Auth': ['auth:signin', 'auth:signup', 'auth:manage'],
  'Realtime': ['realtime:subscribe', 'realtime:publish'],
  'GraphQL': ['graphql:execute'],
}

/**
 * Human-readable descriptions for each scope
 */
export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'db:select': 'Read data from database',
  'db:insert': 'Insert new records',
  'db:update': 'Update existing records',
  'db:delete': 'Delete records',
  'storage:read': 'Read/download files',
  'storage:write': 'Upload files',
  'auth:signin': 'Sign in users',
  'auth:signup': 'Register new users',
  'auth:manage': 'Full user management',
  'realtime:subscribe': 'Subscribe to real-time updates',
  'realtime:publish': 'Publish real-time messages',
  'graphql:execute': 'Execute GraphQL queries',
}

/**
 * MCP Token Types and Scopes
 */

export const tokenTypes = [
  {
    type: 'mcp_ro_',
    name: 'MCP Read-Only',
    color: 'emerald',
    scopes: ['db:select', 'storage:read', 'graphql:execute', 'realtime:read', 'project:read', 'key:read'],
    description: 'Safe for most AI tools - read database access only',
  },
  {
    type: 'mcp_rw_',
    name: 'MCP Read-Write',
    color: 'amber',
    scopes: ['db:select', 'db:insert', 'db:update', 'storage:read', 'storage:write', 'graphql:execute', 'realtime:read'],
    description: 'For trusted AI tools - can modify data',
  },
  {
    type: 'mcp_admin_',
    name: 'MCP Admin',
    color: 'red',
    scopes: [
      'db:select', 'db:insert', 'db:update', 'db:delete', 'db:admin',
      'storage:read', 'storage:write', 'storage:admin',
      'graphql:execute',
      'realtime:read', 'realtime:manage',
      'project:create', 'project:read', 'project:update', 'project:delete',
      'key:create', 'key:read', 'key:delete',
      'auth:manage'
    ],
    description: 'Full access - includes schema, projects, keys, realtime, storage admin - use with extreme caution',
  },
]

export const scopeDescriptions: Record<string, string> = {
  'db:select': 'Query database tables',
  'db:insert': 'Insert new records',
  'db:update': 'Update existing records',
  'db:delete': 'Delete records',
  'db:admin': 'Schema modifications',
  'storage:read': 'Read files from storage',
  'storage:write': 'Upload/modify files',
  'storage:admin': 'Manage buckets',
  'graphql:execute': 'Execute GraphQL queries',
  'realtime:read': 'Read realtime status',
  'realtime:manage': 'Enable/disable realtime',
  'project:create': 'Create projects',
  'project:read': 'Read projects',
  'project:update': 'Update projects',
  'project:delete': 'Delete projects',
  'key:create': 'Create API keys',
  'key:read': 'Read API keys',
  'key:delete': 'Delete API keys',
  'auth:manage': 'Sign in/sign up users',
}

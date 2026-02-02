/**
 * Create API Key Modal Constants
 */

export const MCP_ACCESS_LEVELS = {
  ro: {
    label: 'Read-Only',
    scopes: ['db:select', 'storage:read', 'realtime:subscribe'],
    color: 'teal',
  },
  rw: {
    label: 'Read-Write',
    scopes: [
      'db:select',
      'db:insert',
      'db:update',
      'storage:read',
      'storage:write',
      'realtime:subscribe',
      'graphql:execute',
    ],
    color: 'amber',
  },
  admin: {
    label: 'Admin',
    scopes: [
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
    color: 'red',
  },
} as const

/**
 * Modal Components - Module - Constants
 */

import type { McpAccessLevel } from './types'

export const MCP_ACCESS_LEVEL_SCOPES: Record<McpAccessLevel, string[]> = {
  ro: ['db:select', 'storage:read', 'realtime:subscribe'],
  rw: [
    'db:select',
    'db:insert',
    'db:update',
    'storage:read',
    'storage:write',
    'realtime:subscribe',
    'graphql:execute',
  ],
  admin: [
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

export const MCP_ACCESS_LEVEL_CONFIG = {
  ro: {
    name: 'Read-Only',
    description: 'Safe for AI assistants',
    scopes: 'db:select, storage:read',
    color: 'teal',
    icon: 'Eye',
  },
  rw: {
    name: 'Read-Write',
    description: 'Can modify data',
    scopes: '+ insert, update, write',
    color: 'amber',
    icon: 'RefreshCw',
  },
  admin: {
    name: 'Admin',
    description: 'Full access',
    scopes: '+ delete, auth, publish',
    color: 'red',
    icon: 'ShieldAlert',
  },
} as const

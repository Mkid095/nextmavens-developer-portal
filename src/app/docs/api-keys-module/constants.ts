/**
 * API Keys Documentation - Constants
 */

import { Key, Globe, Shield, Server } from 'lucide-react'
import type { KeyType, EnvironmentExample } from './types'

export const KEY_TYPES: KeyType[] = [
  {
    id: 'public',
    name: 'Public Key',
    icon: Globe,
    prefix: 'pk_live_',
    color: 'blue',
    description: 'Client-side keys for browsers and mobile apps with read-only access',
    useCases: [
      'Web applications running in browsers',
      'Mobile apps (iOS, Android)',
      'Public-facing applications',
      'Read-only data access',
    ],
    scopes: ['db:select', 'storage:read', 'auth:signin', 'realtime:subscribe'],
    warning: 'Can be safely exposed in client-side code',
    security: 'Low risk - read-only access only',
  },
  {
    id: 'secret',
    name: 'Secret Key',
    icon: Key,
    prefix: 'sk_live_',
    color: 'purple',
    description: 'Server-side keys with full CRUD access for backend applications',
    useCases: [
      'Node.js/Python/Go backend services',
      'Server-to-server communication',
      'API integrations',
      'Data processing jobs',
    ],
    scopes: [
      'db:select',
      'db:insert',
      'db:update',
      'db:delete',
      'storage:read',
      'storage:write',
      'auth:manage',
      'graphql:execute',
    ],
    warning: 'NEVER expose in client-side code (browsers, mobile apps)',
    security: 'High risk - must be kept secret',
  },
  {
    id: 'service_role',
    name: 'Service Role Key',
    icon: Shield,
    prefix: 'sr_live_',
    color: 'red',
    description: 'Admin keys that bypass row-level security for trusted backend operations',
    useCases: [
      'Administrative tasks',
      'Data migrations',
      'Background jobs',
      'Trusted server-side operations',
    ],
    scopes: [
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
    warning: 'Bypasses row-level security (RLS) - use with extreme caution',
    security: 'Very high risk - full administrative access',
  },
  {
    id: 'mcp',
    name: 'MCP Token',
    icon: Server,
    prefix: 'mcp_ro_',
    color: 'teal',
    description: 'AI/IDE integration tokens for Model Context Protocol',
    useCases: [
      'AI-powered code generation',
      'IDE integrations (Claude, Cursor, etc.)',
      'Automated development workflows',
      'AI-assisted database operations',
    ],
    scopes: [
      'db:select',
      'db:insert',
      'db:update',
      'db:delete',
      'storage:read',
      'storage:write',
      'graphql:execute',
    ],
    warning: 'Share only with trusted AI tools and IDEs',
    security: 'Medium risk - scope depends on access level',
    accessLevels: ['mcp_ro_ (read-only)', 'mcp_rw_ (read-write)', 'mcp_admin_ (full access)'],
  },
]

export const ENVIRONMENT_EXAMPLES: EnvironmentExample[] = [
  {
    env: 'Production',
    suffix: '_prod_',
    description: 'For live production environments',
  },
  {
    env: 'Staging',
    suffix: '_test_',
    description: 'For testing and staging environments',
  },
  {
    env: 'Development',
    suffix: '_dev_',
    description: 'For local development',
  },
]

export const KEY_COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
}

export const KEY_WARNING_CLASSES: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  red: 'bg-red-50 border-red-200 text-red-800',
  teal: 'bg-teal-50 border-teal-200 text-teal-800',
}

export const EXAMPLE_KEY_FORMAT = `// Public key for production
pk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

// Secret key for staging
sk_test_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4

// Service role for development
sr_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7

// MCP read-only token
mcp_ro_q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6`

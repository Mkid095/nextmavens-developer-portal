/**
 * Project Types Module - Key Type Configuration (US-011)
 */

import type { LucideIcon } from 'lucide-react'
import { Globe, Key, Shield, Server } from 'lucide-react'

/**
 * API key type options
 */
export type KeyType = 'public' | 'secret' | 'service_role' | 'mcp'

/**
 * MCP access level options
 */
export type McpAccessLevel = 'ro' | 'rw' | 'admin'

/**
 * Risk level for API keys
 */
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High'

/**
 * Color theme for key type badges
 */
export type KeyColor = 'blue' | 'purple' | 'red' | 'teal'

/**
 * Key type configuration
 */
export interface KeyTypeConfig {
  name: string
  icon: LucideIcon
  color: KeyColor
  description: string
  warning: string
  defaultScopes: string[]
  riskLevel: RiskLevel
  useCases: string[]
}

/**
 * Key type configurations with their properties
 */
export const KEY_TYPE_CONFIG: Record<KeyType, KeyTypeConfig> = {
  public: {
    name: 'Public Key',
    icon: Globe,
    color: 'blue',
    description: 'Safe for client-side code. Can be exposed in browsers and mobile apps.',
    warning: 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.',
    defaultScopes: ['db:select', 'storage:read', 'auth:signin', 'realtime:subscribe'],
    riskLevel: 'Low',
    useCases: ['Web applications', 'Mobile apps', 'Public APIs', 'Read-only data access'],
  },
  secret: {
    name: 'Secret Key',
    icon: Key,
    color: 'purple',
    description: 'Server-side key with full CRUD access. Never expose in client code.',
    warning: 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.',
    defaultScopes: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'auth:manage', 'graphql:execute'],
    riskLevel: 'High',
    useCases: ['Backend services', 'Server-to-server communication', 'API integrations', 'Data processing'],
  },
  service_role: {
    name: 'Service Role Key',
    icon: Shield,
    color: 'red',
    description: 'Bypasses row-level security for admin tasks. Use with extreme caution.',
    warning: 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.',
    defaultScopes: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'auth:manage', 'graphql:execute', 'realtime:subscribe', 'realtime:publish'],
    riskLevel: 'Very High',
    useCases: ['Administrative tasks', 'Data migrations', 'Background jobs', 'Trusted operations'],
  },
  mcp: {
    name: 'MCP Token',
    icon: Server,
    color: 'teal',
    description: 'AI/IDE integration token for Model Context Protocol.',
    warning: 'Share this token only with trusted AI tools and IDEs. Scope depends on access level selected.',
    defaultScopes: ['db:select', 'storage:read', 'realtime:subscribe'],
    riskLevel: 'Medium',
    useCases: ['AI-powered code generation', 'IDE integrations', 'Automated workflows', 'AI-assisted operations'],
  },
}

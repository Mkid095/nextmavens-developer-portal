// Constants for CreateApiKeyModal

import { Globe, Key, Shield, Cpu } from 'lucide-react'
import { ApiKeyType, ApiKeyEnvironment, ApiKeyScope, DEFAULT_SCOPES } from '@/lib/types/api-key.types'
import type { KeyTypeOption } from './types'

export const KEY_TYPE_OPTIONS: KeyTypeOption[] = [
  {
    type: 'public',
    title: 'Public Key',
    description: 'Safe for client-side apps. Read-only access to data.',
    icon: Globe,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    warning: 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.',
    defaultScopes: DEFAULT_SCOPES.public,
    useCases: ['Frontend web apps', 'Mobile apps', 'Public APIs', 'Browser SDKs'],
  },
  {
    type: 'secret',
    title: 'Secret Key',
    description: 'Full CRUD access. For server-side applications only.',
    icon: Key,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    warning: 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.',
    defaultScopes: DEFAULT_SCOPES.secret,
    useCases: ['Backend servers', 'API integrations', 'CLI tools', 'Serverless functions'],
  },
  {
    type: 'service_role',
    title: 'Service Role Key',
    description: 'Bypasses RLS. Full admin access for trusted services.',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    warning: 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.',
    defaultScopes: DEFAULT_SCOPES.service_role,
    useCases: ['Admin tasks', 'Database migrations', 'Trusted backend services', 'Cron jobs'],
  },
  {
    type: 'mcp',
    title: 'MCP Token',
    description: 'For AI tools and Model Context Protocol integrations.',
    icon: Cpu,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    warning: 'This token is for use with AI assistants and MCP-compatible tools. Different access levels provide varying permissions. Keep tokens secure and rotate regularly.',
    defaultScopes: DEFAULT_SCOPES.mcp_ro,
    useCases: ['AI assistants', 'Claude MCP integration', 'Automated agents', 'Tool integrations'],
  },
]

export const ENVIRONMENT_OPTIONS: { value: ApiKeyEnvironment; label: string; description: string }[] = [
  { value: 'prod', label: 'Production', description: 'Live environment for production applications' },
  { value: 'staging', label: 'Staging', description: 'Pre-production testing environment' },
  { value: 'dev', label: 'Development', description: 'Development and testing environment' },
]

export const MCP_ACCESS_LEVELS = [
  { value: 'ro' as const, label: 'Read Only', description: 'Can only read data', color: 'text-emerald-600' },
  { value: 'rw' as const, label: 'Read/Write', description: 'Can read and modify data', color: 'text-amber-600' },
  { value: 'admin' as const, label: 'Admin', description: 'Full access including delete', color: 'text-red-600' },
]

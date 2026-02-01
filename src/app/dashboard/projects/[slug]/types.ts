import type { LucideIcon } from 'lucide-react'
import {
  Database,
  Shield,
  HardDrive,
  Activity,
  Code2,
  Key,
  Settings,
  BarChart3,
  Globe,
  Server,
  ShieldAlert,
  Edit3,
  Lock,
  EyeOff as EyeOffIcon,
} from 'lucide-react'
import type { ServiceStatus } from '@/lib/types/service-status.types'

// ============================================================================
// Project & API Key Types
// ============================================================================

export interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  created_at: string
  status?: string
  environment?: 'prod' | 'dev' | 'staging'
}

export interface ApiKey {
  id: string
  name: string
  key_type: string
  key_prefix: string
  public_key: string
  created_at: string
  status?: string
  expires_at?: string
  last_used?: string
  usage_count?: number
}

// ============================================================================
// Service Status Types (US-010)
// ============================================================================

export interface ServiceStatuses {
  database: ServiceStatus
  auth: ServiceStatus
  storage: ServiceStatus
  realtime: ServiceStatus
  graphql: ServiceStatus
}

// ============================================================================
// Key Usage Statistics (US-005)
// ============================================================================

export interface KeyUsageStats {
  keyId: string
  usageCount: number
  lastUsed: string | null
  createdAt: string
  usageByTimePeriod: {
    last7Days: number
    last30Days: number
  }
  successErrorRate: {
    total: number
    success: number
    error: number
    successRate: number
    errorRate: number
  }
}

export interface NewKeyResponse {
  apiKey: ApiKey
  secretKey?: string
}

// ============================================================================
// Tab Configuration
// ============================================================================

export type Tab = 'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys' | 'secrets' | 'mcp-analytics' | 'feature-flags' | 'support'

export interface TabConfig {
  id: Tab
  label: string
  icon: LucideIcon
}

export const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'auth', label: 'Auth', icon: Shield },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'realtime', label: 'Realtime', icon: Activity },
  { id: 'graphql', label: 'GraphQL', icon: Code2 },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'secrets', label: 'Secrets', icon: Key },
  { id: 'mcp-analytics', label: 'MCP Analytics', icon: BarChart3 },
  { id: 'feature-flags', label: 'Feature Flags', icon: ShieldAlert },
  { id: 'support', label: 'Support', icon: Settings },
]

// ============================================================================
// Suspension Types
// ============================================================================

export interface SuspensionReason {
  cap_type: string
  current_value: number
  limit_exceeded: number
  details?: string
}

export interface SuspensionRecord {
  id: string
  project_id: string
  reason: SuspensionReason
  cap_exceeded: string
  suspended_at: string
  resolved_at: string | null
  notes?: string
}

export interface SuspensionStatusResponse {
  suspended: boolean
  suspension?: SuspensionRecord
  message?: string
}

// ============================================================================
// Key Type Configuration (US-011)
// ============================================================================

export type KeyType = 'public' | 'secret' | 'service_role' | 'mcp'
export type McpAccessLevel = 'ro' | 'rw' | 'admin'

export interface KeyTypeConfig {
  name: string
  icon: LucideIcon
  color: 'blue' | 'purple' | 'red' | 'teal'
  description: string
  warning: string
  defaultScopes: string[]
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  useCases: string[]
}

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

// ============================================================================
// Scope Configuration
// ============================================================================

export const SCOPES_BY_SERVICE: Record<string, string[]> = {
  'Database (db)': ['db:select', 'db:insert', 'db:update', 'db:delete'],
  'Storage': ['storage:read', 'storage:write'],
  'Auth': ['auth:signin', 'auth:signup', 'auth:manage'],
  'Realtime': ['realtime:subscribe', 'realtime:publish'],
  'GraphQL': ['graphql:execute'],
}

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

// ============================================================================
// MCP Token Types (US-010)
// ============================================================================

export interface McpTokenInfo {
  isMcp: boolean
  label: string
  bgColor: string
  textColor: string
  icon: LucideIcon
  showWarning: boolean
}

export function getMcpTokenInfo(keyPrefix: string, keyType: string): McpTokenInfo {
  // Check if this is an MCP token
  if (keyType !== 'mcp' || !keyPrefix.startsWith('mcp_')) {
    return {
      isMcp: false,
      label: keyType,
      bgColor: 'bg-slate-200',
      textColor: 'text-slate-700',
      icon: Key,
      showWarning: false,
    }
  }

  // Extract MCP access level from prefix (mcp_ro_, mcp_rw_, mcp_admin_)
  const match = keyPrefix.match(/^mcp_(ro|rw|admin)_/)
  const accessLevel = match ? match[1] : 'ro'

  switch (accessLevel) {
    case 'ro':
      return {
        isMcp: true,
        label: 'MCP Read-Only',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: EyeOffIcon,
        showWarning: false,
      }
    case 'rw':
      return {
        isMcp: true,
        label: 'MCP Read-Write',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: Edit3,
        showWarning: true,
      }
    case 'admin':
      return {
        isMcp: true,
        label: 'MCP Admin',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: Lock,
        showWarning: true,
      }
    default:
      return {
        isMcp: true,
        label: 'MCP',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-700',
        icon: Server,
        showWarning: false,
      }
  }
}

// ============================================================================
// Service Endpoints
// ============================================================================

export interface ServiceEndpoints {
  gateway: string
  auth: string
  graphql: string
  rest: string
  realtime: string
  storage: string
}

export function getServiceEndpoints(): ServiceEndpoints {
  return {
    gateway: 'https://api.nextmavens.cloud',
    auth: 'https://auth.nextmavens.cloud',
    graphql: 'https://graphql.nextmavens.cloud',
    rest: 'https://api.nextmavens.cloud',
    realtime: 'wss://realtime.nextmavens.cloud',
    storage: 'https://storage.nextmavens.cloud',
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export interface EnvironmentOption {
  value: 'live' | 'test' | 'dev'
  label: string
  prefix: string
}

export const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  { value: 'live', label: 'Production (Live)', prefix: 'pk_live_' },
  { value: 'test', label: 'Staging (Test)', prefix: 'pk_test_' },
  { value: 'dev', label: 'Development (Dev)', prefix: 'pk_dev_' },
]

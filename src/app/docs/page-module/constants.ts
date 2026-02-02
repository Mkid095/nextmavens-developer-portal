/**
 * Docs Main Page - Module - Constants
 */

import type { LucideIcon } from 'lucide-react'
import { Server, Shield, Database, Globe, Radio, HardDrive, Zap } from 'lucide-react'

export type ServiceColor = 'indigo' | 'purple' | 'blue' | 'emerald' | 'orange' | 'teal' | 'slate'

export interface Service {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: ServiceColor
  domain: string
  port: number
  endpoints: string[]
  features: string[]
  path: string
}

export interface QuickReference {
  name: string
  url: string
  description: string
}

export interface AdditionalResource {
  title: string
  description: string
  icon: LucideIcon
  color: string
  href: string
}

export const SERVICES: Service[] = [
  {
    id: 'api-gateway',
    title: 'API Gateway',
    description: 'Central entry point for all API requests with rate limiting, authentication, and routing',
    icon: Server,
    color: 'indigo',
    domain: 'https://api.nextmavens.cloud',
    port: 8080,
    endpoints: ['/api/auth', '/api', '/graphql', '/realtime', '/api/storage', '/api/developer'],
    features: ['Rate Limiting', 'JWT Validation', 'Request Logging', 'CORS'],
    path: '#api-gateway',
  },
  {
    id: 'auth',
    title: 'Authentication Service',
    description: 'User registration, login, and JWT token management',
    icon: Shield,
    color: 'purple',
    domain: 'https://auth.nextmavens.cloud',
    port: 4000,
    endpoints: ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh', '/api/auth/logout'],
    features: ['JWT Tokens', 'bcrypt Hashing', 'Refresh Tokens', 'Session Management'],
    path: '/docs/auth',
  },
  {
    id: 'database',
    title: 'Database / PostgREST',
    description: 'PostgreSQL with full REST API access via PostgREST',
    icon: Database,
    color: 'blue',
    domain: 'https://api.nextmavens.cloud',
    port: 3001,
    endpoints: ['/{table}', '/rpc/{function}', '/graphql'],
    features: ['CRUD Operations', 'RLS Policies', 'Prepared Statements', 'Multi-tenant'],
    path: '/docs/database',
  },
  {
    id: 'graphql',
    title: 'GraphQL Service',
    description: 'Postgraphile-powered GraphQL with automatic schema generation',
    icon: Globe,
    color: 'emerald',
    domain: 'https://api.nextmavens.cloud',
    port: 4004,
    endpoints: ['/graphql', '/graphiql'],
    features: ['Auto Schema', 'Relations', 'Mutations', 'Subscriptions'],
    path: '/docs/graphql',
  },
  {
    id: 'realtime',
    title: 'Realtime Service',
    description: 'PostgreSQL LISTEN/NOTIFY for realtime data subscriptions',
    icon: Radio,
    color: 'emerald',
    domain: 'https://api.nextmavens.cloud',
    port: 4003,
    endpoints: ['/realtime/subscribe', '/realtime/publish'],
    features: ['WebSocket', 'CDC Events', 'Channel Subscriptions', 'Event Streaming'],
    path: '/docs/realtime',
  },
  {
    id: 'storage',
    title: 'Telegram Storage',
    description: 'File storage via Telegram with CDN access',
    icon: HardDrive,
    color: 'orange',
    domain: 'https://telegram-api.nextmavens.cloud',
    port: 4005,
    endpoints: ['/api/files', '/api/files/{id}/download', '/webhook/telegram'],
    features: ['File Upload', 'CDN URLs', 'Metadata', 'Telegram Integration'],
    path: '/docs/storage',
  },
  {
    id: 'mcp',
    title: 'MCP Server',
    description: 'Model Context Protocol for AI/IDE integration with 11+ tools',
    icon: Zap,
    color: 'teal',
    domain: 'https://api.nextmavens.cloud',
    port: 8080,
    endpoints: ['/mcp'],
    features: ['11 AI Tools', 'Claude/Cursor Compatible', 'Scoped Access', 'Audit Logged'],
    path: '/docs/mcp',
  },
]

export const QUICK_REFERENCE: QuickReference[] = [
  { name: 'API Gateway', url: 'https://api.nextmavens.cloud', description: 'Main API entry point' },
  { name: 'Developer Portal', url: 'https://portal.nextmavens.cloud', description: 'Dashboard & project management' },
  { name: 'Dokploy', url: 'https://dokploy.nextmavens.cloud', description: 'Deployment management' },
  { name: 'Auth Service', url: 'https://auth.nextmavens.cloud', description: 'User authentication' },
  { name: 'Telegram Storage', url: 'https://telegram-api.nextmavens.cloud', description: 'File storage API' },
  { name: 'Telegram Bot', url: 'https://telegram.nextmavens.cloud', description: 'Deployment notifications' },
]

export const SERVICE_COLOR_CLASSES: Record<ServiceColor, string> = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  teal: 'bg-teal-100 text-teal-700',
  slate: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-700',
}

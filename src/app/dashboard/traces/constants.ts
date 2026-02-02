/**
 * Traces Page Constants
 * Service icon and color mappings
 */

import {
  Zap,
  Activity,
  Code2,
  Database,
  Shield,
  GitBranch,
  Radio,
  HardDrive,
  Webhook,
} from 'lucide-react'

export const SERVICE_ICONS: Record<string, React.ElementType> = {
  gateway: Zap,
  'developer-portal': Activity,
  'control-plane-api': Code2,
  database: Database,
  auth: Shield,
  graphql: GitBranch,
  realtime: Radio,
  storage: HardDrive,
  functions: Code2,
  webhooks: Webhook,
}

export const SERVICE_COLORS: Record<string, string> = {
  gateway: '#8b5cf6', // violet
  'developer-portal': '#10b981', // emerald
  'control-plane-api': '#f59e0b', // amber
  database: '#3b82f6', // blue
  auth: '#ef4444', // red
  graphql: '#ec4899', // pink
  realtime: '#14b8a6', // teal
  storage: '#f97316', // orange
  functions: '#6366f1', // indigo
  webhooks: '#a855f7', // purple
}

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700',
}

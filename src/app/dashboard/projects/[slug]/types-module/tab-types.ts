/**
 * Project Types Module - Tab Configuration
 */

import type { LucideIcon } from 'lucide-react'
import {
  Settings,
  Database,
  Shield,
  HardDrive,
  Activity,
  Code2,
  Key,
  BarChart3,
  ShieldAlert,
} from 'lucide-react'

/**
 * Available tabs in project detail page
 */
export type Tab = 'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys' | 'secrets' | 'mcp-analytics' | 'feature-flags' | 'support'

/**
 * Tab configuration with label and icon
 */
export interface TabConfig {
  id: Tab
  label: string
  icon: LucideIcon
}

/**
 * Available tabs configuration
 */
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

/**
 * Docs Sidebar Sections
 */

import { BookOpen, Database, Shield, HardDrive, Globe, DatabaseBackup, Code, Zap, Tag } from 'lucide-react'
import type { SidebarSection } from './types'

export const sidebarSections: SidebarSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    color: 'emerald',
    path: '/docs',
    children: [
      { title: 'Introduction', path: '/docs' },
      { title: 'Platform Philosophy', path: '/docs/platform-philosophy' },
    ],
  },
  {
    id: 'database',
    title: 'Database',
    icon: Database,
    color: 'blue',
    path: '/docs/database',
    children: [
      { title: 'Overview', path: '/docs/database' },
      { title: 'Limits & Quotas', path: '/docs/database/limits' },
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: Shield,
    color: 'purple',
    path: '/docs/auth',
    children: [
      { title: 'Overview', path: '/docs/auth' },
    ],
  },
  {
    id: 'realtime',
    title: 'Realtime',
    icon: Zap,
    color: 'orange',
    path: '/docs/realtime',
    children: [
      { title: 'Overview', path: '/docs/realtime' },
    ],
  },
  {
    id: 'storage',
    title: 'Storage',
    icon: HardDrive,
    color: 'orange',
    path: '/docs/storage',
    children: [
      { title: 'Overview', path: '/docs/storage' },
    ],
  },
  {
    id: 'graphql',
    title: 'GraphQL',
    icon: Globe,
    color: 'emerald',
    path: '/docs/graphql',
    children: [
      { title: 'Overview', path: '/docs/graphql' },
    ],
  },
  {
    id: 'sdk',
    title: 'SDK',
    icon: Code,
    color: 'slate',
    path: '/docs/sdk',
    children: [
      { title: 'Overview', path: '/docs/sdk' },
    ],
  },
  {
    id: 'mcp-integration',
    title: 'MCP Integration',
    icon: Globe,
    color: 'teal',
    path: '/mcp',
    children: [
      { title: 'Overview', path: '/mcp' },
    ],
  },
  {
    id: 'backups',
    title: 'Backup Strategy',
    icon: DatabaseBackup,
    color: 'blue',
    path: '/docs/backups',
    children: [
      { title: 'Overview', path: '/docs/backups' },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    icon: Database,
    color: 'slate',
    path: '/docs/infrastructure',
    children: [
      { title: 'Overview', path: '/docs/infrastructure' },
    ],
  },
  {
    id: 'versioning',
    title: 'Versioning',
    icon: Tag,
    color: 'purple',
    path: '/docs/versioning',
    children: [
      { title: 'Overview', path: '/docs/versioning' },
    ],
  },
]

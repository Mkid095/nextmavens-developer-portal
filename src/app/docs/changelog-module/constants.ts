/**
 * Changelog - Constants
 */

import { Plus, Wrench, AlertTriangle, Trash2, Bug } from 'lucide-react'
import type { CategoryType, ChangelogEntry } from './types'

export const CATEGORY_ICONS: Record<CategoryType, ReturnType<typeof Plus>> = {
  added: Plus,
  changed: Wrench,
  deprecated: AlertTriangle,
  removed: Trash2,
  fixed: Bug,
}

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  added: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  changed: 'bg-blue-50 border-blue-200 text-blue-900',
  deprecated: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  removed: 'bg-red-50 border-red-200 text-red-900',
  fixed: 'bg-purple-50 border-purple-200 text-purple-900',
}

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  added: 'Added',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
}

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: '2.1.0',
    releaseDate: '2025-01-15',
    status: 'current',
    categories: {
      added: [
        'SDK TypeScript examples for all database operations',
        'Visual schema diagram for database table relationships',
        'Automatic webhook disabling with email notifications on repeated failures',
        'Secret access logging to audit.log for improved security tracking',
      ],
      changed: [
        'Improved error messages for quota exceeded scenarios',
        'Enhanced RBAC permission checking with clearer denial reasons',
      ],
      fixed: [
        'Fixed secret deletion to properly clean up references',
        'Fixed project status badge display in dark mode',
      ],
    },
    pullRequests: [
      {
        number: 142,
        title: 'feat: implement US-009 - Add TypeScript Examples to SDK Docs',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/142',
      },
      {
        number: 145,
        title: 'feat: implement US-011 - Visual Schema Diagram',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/145',
      },
    ],
    issues: [
      {
        number: 138,
        title: 'Webhooks continue running after repeated failures',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/issues/138',
      },
      {
        number: 140,
        title: 'Secret deletion leaves orphaned references',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/issues/140',
      },
    ],
  },
  {
    version: '2.0.0',
    releaseDate: '2024-12-01',
    status: 'stable',
    categories: {
      added: [
        'Project lifecycle management (CREATED, ACTIVE, SUSPENDED, ARCHIVED, DELETED states)',
        'Quotas and limits with hard cap enforcement',
        'RBAC system with role-based permissions (Owner, Admin, Developer, Viewer)',
        'Usage dashboard with historical charts',
        'Realtime documentation with WebSocket examples',
        'Version discovery endpoint GET /versions',
        'Platform invariants documentation',
      ],
      changed: [
        'API response structure now uses standardized format with `data` wrapper',
        'Error codes follow new ErrorCode enum format',
        'Authentication headers now require Bearer token format',
      ],
      deprecated: [
        'Legacy authentication using API key in query parameter (use Authorization header instead)',
      ],
      removed: [
        'Deprecated `/v1/projects/:id/members` endpoint (use `/v1/orgs/:id/members` instead)',
        'Legacy project status field (use new `status` enum)',
      ],
      fixed: [
        'Fixed SQL injection vulnerabilities in query builder',
        'Fixed rate limiting bypass in API gateway',
        'Fixed permission check bypass in Studio query execution',
      ],
    },
    pullRequests: [
      {
        number: 120,
        title: 'feat: implement RBAC system',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/120',
      },
      {
        number: 125,
        title: 'feat: implement project lifecycle management',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/125',
      },
    ],
  },
  {
    version: '1.5.0',
    releaseDate: '2024-10-15',
    status: 'stable',
    categories: {
      added: [
        'SDK support for both API v1 and v2',
        'Breaking change policy documentation',
        'Migration guide from v1 to v2',
        'Deprecation timeline (6 months for breaking changes)',
      ],
      changed: ['Improved SDK error handling with detailed error codes'],
      fixed: ['Fixed SDK connection pool exhaustion', 'Fixed authentication token refresh timing'],
    },
    pullRequests: [
      {
        number: 98,
        title: 'feat: add migration guides',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/98',
      },
    ],
  },
  {
    version: '1.0.0',
    releaseDate: '2024-08-01',
    status: 'deprecated',
    categories: {
      added: [
        'Initial API release with database, auth, storage, and realtime',
        'JavaScript SDK with full TypeScript support',
        'MCP integration with 11 AI-powered tools',
        'API key management (Public, Secret, Service Role, MCP)',
        'Backup strategy with Telegram integration',
        'Infrastructure documentation',
        'Error codes reference',
      ],
      changed: ['Initial stable release'],
    },
    pullRequests: [
      {
        number: 50,
        title: 'feat: initial stable release v1.0.0',
        url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/50',
      },
    ],
  },
]

'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Github, GitPullRequest, Bug, Plus, AlertTriangle, Trash2, Wrench, Rss } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface ChangelogEntry {
  version: string
  releaseDate: string
  status: 'current' | 'stable' | 'deprecated'
  categories: {
    added?: string[]
    changed?: string[]
    deprecated?: string[]
    removed?: string[]
    fixed?: string[]
  }
  pullRequests?: Array<{
    number: number
    title: string
    url: string
  }>
  issues?: Array<{
    number: number
    title: string
    url: string
  }>
}

const changelogData: ChangelogEntry[] = [
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
      { number: 142, title: 'feat: implement US-009 - Add TypeScript Examples to SDK Docs', url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/142' },
      { number: 145, title: 'feat: implement US-011 - Visual Schema Diagram', url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/145' },
    ],
    issues: [
      { number: 138, title: 'Webhooks continue running after repeated failures', url: 'https://github.com/Mkid095/nextmavens-developer-portal/issues/138' },
      { number: 140, title: 'Secret deletion leaves orphaned references', url: 'https://github.com/Mkid095/nextmavens-developer-portal/issues/140' },
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
      { number: 120, title: 'feat: implement RBAC system', url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/120' },
      { number: 125, title: 'feat: implement project lifecycle management', url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/125' },
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
      changed: [
        'Improved SDK error handling with detailed error codes',
      ],
      fixed: [
        'Fixed SDK connection pool exhaustion',
        'Fixed authentication token refresh timing',
      ],
    },
    pullRequests: [
      { number: 98, title: 'feat: add migration guides', url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/98' },
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
      changed: [
        'Initial stable release',
      ],
    },
    pullRequests: [
      { number: 50, title: 'feat: initial stable release v1.0.0', url: 'https://github.com/Mkid095/nextmavens-developer-portal/pull/50' },
    ],
  },
]

const categoryIcons = {
  added: Plus,
  changed: Wrench,
  deprecated: AlertTriangle,
  removed: Trash2,
  fixed: Bug,
}

const categoryColors = {
  added: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  changed: 'bg-blue-50 border-blue-200 text-blue-900',
  deprecated: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  removed: 'bg-red-50 border-red-200 text-red-900',
  fixed: 'bg-purple-50 border-purple-200 text-purple-900',
}

const categoryLabels = {
  added: 'Added',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
}

export default function ChangelogPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const generateRSS = () => {
    const rssItems = changelogData.map(entry => {
      const categories = Object.entries(entry.categories)
        .filter(([_, items]) => items && items.length > 0)
        .map(([category, items]) => `${category.toUpperCase()}: ${items?.join(', ')}`)
        .join('\n')

      return `
    <item>
      <title>Version ${entry.version}</title>
      <link>https://nextmavens.cloud/docs/changelog#${entry.version.replace('.', '-')}</link>
      <description><![CDATA[
        <h3>Version ${entry.version}</h3>
        <p><strong>Released:</strong> ${entry.releaseDate}</p>
        <p><strong>Status:</strong> ${entry.status}</p>
        <pre>${categories}</pre>
      ]]></description>
      <pubDate>${new Date(entry.releaseDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">nextmavens-${entry.version}</guid>
    </item>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NextMavens Changelog</title>
    <link>https://nextmavens.cloud/docs/changelog</link>
    <description>Latest updates and changes to the NextMavens platform</description>
    <language>en-us</language>
    <atom:link href="https://nextmavens.cloud/docs/changelog/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`
  }

  const downloadRSS = () => {
    const rss = generateRSS()
    const blob = new Blob([rss], { type: 'application/rss+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'changelog.rss'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Changelog</h1>
              <p className="text-slate-600">Track the latest updates, improvements, and fixes</p>
            </div>
          </div>
          <button
            onClick={downloadRSS}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <Rss className="w-4 h-4" />
            Subscribe to RSS
          </button>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">About This Changelog</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            This changelog documents all notable changes to the NextMavens platform and SDK.
            Entries are organized by version and categorized by type (added, changed, deprecated, removed, fixed).
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900">Added</h3>
                <p className="text-sm text-slate-600">New features and functionality</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900">Changed</h3>
                <p className="text-sm text-slate-600">Modifications to existing features</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900">Deprecated</h3>
                <p className="text-sm text-slate-600">Features marked for future removal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900">Removed</h3>
                <p className="text-sm text-slate-600">Features removed in this release</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900">Fixed</h3>
                <p className="text-sm text-slate-600">Bug fixes and corrections</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GitPullRequest className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900">Pull Requests</h3>
                <p className="text-sm text-slate-600">Linked to relevant PRs and issues</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {changelogData.map((entry, index) => (
            <motion.div
              key={entry.version}
              id={entry.version.replace('.', '-')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className={`p-6 border-b border-slate-200 ${
                entry.status === 'current' ? 'bg-emerald-50' :
                entry.status === 'deprecated' ? 'bg-red-50' :
                'bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">Version {entry.version}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      entry.status === 'current' ? 'bg-emerald-200 text-emerald-900' :
                      entry.status === 'deprecated' ? 'bg-red-200 text-red-900' :
                      'bg-blue-200 text-blue-900'
                    }`}>
                      {entry.status === 'current' ? 'Current' :
                       entry.status === 'deprecated' ? 'Deprecated' :
                       'Stable'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Released: {new Date(entry.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {(Object.keys(entry.categories) as Array<keyof typeof entry.categories>).map((category) => {
                  const items = entry.categories[category]
                  if (!items || items.length === 0) return null

                  const Icon = categoryIcons[category]
                  const colorClass = categoryColors[category]

                  return (
                    <div key={category} className={`border rounded-lg p-4 ${colorClass}`}>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {categoryLabels[category]}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}

                {entry.pullRequests && entry.pullRequests.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
                      <GitPullRequest className="w-4 h-4" />
                      Pull Requests
                    </h3>
                    <ul className="space-y-2">
                      {entry.pullRequests.map((pr) => (
                        <li key={pr.number}>
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            #{pr.number}: {pr.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.issues && entry.issues.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
                      <Github className="w-4 h-4" />
                    Related Issues
                    </h3>
                    <ul className="space-y-2">
                      {entry.issues.map((issue) => (
                        <li key={issue.number}>
                          <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            #{issue.number}: {issue.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/versioning" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Versioning Strategy
          </Link>
        </div>
      </main>
    </div>
  )
}

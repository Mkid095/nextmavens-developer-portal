/**
 * Docs Main Page - Module - Additional Resources Component
 */

import Link from 'next/link'
import { Key, Code2, AlertCircle, DatabaseBackup, Server, FileText } from 'lucide-react'

const additionalResources = [
  {
    title: 'API Keys',
    description: 'Understanding key types, scopes, and security best practices',
    icon: Key,
    color: 'text-indigo-600',
    href: '/docs/api-keys',
  },
  {
    title: 'JavaScript SDK',
    description: 'Official TypeScript client for NextMavens platform',
    icon: Code2,
    color: 'text-blue-600',
    href: '/docs/sdk',
  },
  {
    title: 'Error Codes',
    description: 'Complete API error reference and troubleshooting guide',
    icon: AlertCircle,
    color: 'text-red-600',
    href: '/docs/errors',
  },
  {
    title: 'Backup Strategy',
    description: 'Database and storage backup with retention policies',
    icon: DatabaseBackup,
    color: 'text-blue-600',
    href: '/docs/backups',
  },
  {
    title: 'Infrastructure',
    description: 'Deployment architecture, scaling, and operations',
    icon: Server,
    color: 'text-slate-600',
    href: '/docs/infrastructure',
  },
  {
    title: 'Changelog',
    description: 'Latest updates, improvements, and fixes',
    icon: FileText,
    color: 'text-purple-600',
    href: '/docs/changelog',
  },
]

export function AdditionalResources() {
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Additional Resources</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {additionalResources.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition"
          >
            <resource.icon className={`w-8 h-8 ${resource.color} mb-3`} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{resource.title}</h3>
            <p className="text-sm text-slate-600">{resource.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

/**
 * Changelog - Changelog Entry Card Component
 */

import { motion } from 'framer-motion'
import { GitPullRequest, Github } from 'lucide-react'
import { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants'
import { formatReleaseDate, getVersionId } from '../utils'
import type { ChangelogEntry, CategoryType } from '../types'

interface ChangelogEntryCardProps {
  entry: ChangelogEntry
  index: number
}

export function ChangelogEntryCard({ entry, index }: ChangelogEntryCardProps) {
  const statusBgColor =
    entry.status === 'current'
      ? 'bg-emerald-50'
      : entry.status === 'deprecated'
      ? 'bg-red-50'
      : 'bg-slate-50'

  const statusBadgeColor =
    entry.status === 'current'
      ? 'bg-emerald-200 text-emerald-900'
      : entry.status === 'deprecated'
      ? 'bg-red-200 text-red-900'
      : 'bg-blue-200 text-blue-900'

  const statusLabel =
    entry.status === 'current' ? 'Current' : entry.status === 'deprecated' ? 'Deprecated' : 'Stable'

  return (
    <motion.div
      key={entry.version}
      id={getVersionId(entry.version)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <div className={`p-6 border-b border-slate-200 ${statusBgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Version {entry.version}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="text-sm text-slate-600">Released: {formatReleaseDate(entry.releaseDate)}</div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {(Object.keys(entry.categories) as CategoryType[]).map((category) => {
          const items = entry.categories[category]
          if (!items || items.length === 0) return null

          const Icon = CATEGORY_ICONS[category]
          const colorClass = CATEGORY_COLORS[category]
          const label = CATEGORY_LABELS[category]

          return (
            <div key={category} className={`border rounded-lg p-4 ${colorClass}`}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
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
  )
}

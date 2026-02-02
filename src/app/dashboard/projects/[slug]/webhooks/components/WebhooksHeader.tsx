/**
 * WebhooksPageHeader Component
 *
 * Header for the webhooks page with navigation and action buttons.
 */

'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, History } from 'lucide-react'

interface WebhooksHeaderProps {
  slug: string
  projectName: string | undefined
  showCreateForm: boolean
  setShowCreateForm: (show: boolean) => void
  onShowHistory: () => void
}

export function WebhooksHeader({
  slug,
  projectName,
  showCreateForm,
  setShowCreateForm,
  onShowHistory,
}: WebhooksHeaderProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/projects/${slug}`}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Webhooks</h1>
              {projectName && (
                <p className="text-sm text-slate-400">
                  Project: {projectName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onShowHistory}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <History className="h-4 w-4" />
              View History
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

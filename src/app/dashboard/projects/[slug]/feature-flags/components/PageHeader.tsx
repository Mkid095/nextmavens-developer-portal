/**
 * Page Header Component
 * Header for feature flags page
 */

import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

interface PageHeaderProps {
  projectSlug: string
  onAddFlag: () => void
}

export function PageHeader({ projectSlug, onAddFlag }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1180px] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/projects/${projectSlug}`}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Feature Flags</h1>
              <p className="text-sm text-slate-600">{projectSlug}</p>
            </div>
          </div>

          <button
            onClick={onAddFlag}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Project Flag
          </button>
        </div>
      </div>
    </div>
  )
}

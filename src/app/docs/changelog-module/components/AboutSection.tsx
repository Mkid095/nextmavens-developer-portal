/**
 * Changelog - About Section Component
 */

import { Plus, Wrench, AlertTriangle, Trash2, Bug, GitPullRequest } from 'lucide-react'

export function AboutSection() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">About This Changelog</h2>
      <p className="text-slate-600 leading-relaxed mb-4">
        This changelog documents all notable changes to the NextMavens platform and SDK. Entries are
        organized by version and categorized by type (added, changed, deprecated, removed, fixed).
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
  )
}

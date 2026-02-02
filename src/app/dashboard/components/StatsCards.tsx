/**
 * Stats Cards Component
 *
 * Displays the dashboard statistics cards.
 */

'use client'

import { Key, Database, Shield } from 'lucide-react'

interface StatsCardsProps {
  apiKeysCount: number
  projectsCount: number
}

export function StatsCards({ apiKeysCount, projectsCount }: StatsCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Key className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="font-medium text-slate-900">API Keys</span>
        </div>
        <div className="text-3xl font-semibold text-slate-900">{apiKeysCount}</div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-5 h-5 text-blue-700" />
          </div>
          <span className="font-medium text-slate-900">Projects</span>
        </div>
        <div className="text-3xl font-semibold text-slate-900">{projectsCount}</div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-700" />
          </div>
          <span className="font-medium text-slate-900">Services</span>
        </div>
        <div className="text-3xl font-semibold text-slate-900">5</div>
      </div>
    </div>
  )
}

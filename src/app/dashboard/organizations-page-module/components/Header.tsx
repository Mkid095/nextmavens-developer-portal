/**
 * Organizations Page - Module - Header Component
 */

import { Plus } from 'lucide-react'

interface HeaderProps {
  onCreateClick: () => void
}

export function Header({ onCreateClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
            <p className="text-slate-600 mt-1">Manage your team organizations and projects</p>
          </div>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
          >
            <Plus className="w-5 h-5" />
            Create Organization
          </button>
        </div>
      </div>
    </header>
  )
}

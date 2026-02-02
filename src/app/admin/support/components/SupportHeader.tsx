/**
 * Support Header Component
 * Header for admin support dashboard
 */

import { LifeBuoy, RefreshCw } from 'lucide-react'

interface SupportHeaderProps {
  loading: boolean
  onRefresh: () => void
}

export function SupportHeader({ loading, onRefresh }: SupportHeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <LifeBuoy className="w-8 h-8 text-blue-600" />
              Admin Support Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">Manage and respond to user support requests</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

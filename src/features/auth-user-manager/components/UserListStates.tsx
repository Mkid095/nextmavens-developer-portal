'use client'

import { Loader2, Users } from 'lucide-react'

interface UserListStatesProps {
  loading: boolean
  error: string | null
  userCount: number
  onRetry: () => void
}

export function UserListStates({ loading, error, userCount, onRetry }: UserListStatesProps) {
  if (loading && userCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error && userCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-slate-900 font-medium mb-1">Error loading users</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (userCount === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 mb-1">No users found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your filters or check back later
          </p>
        </div>
      </div>
    )
  }

  return null
}

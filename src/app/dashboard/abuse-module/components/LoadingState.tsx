/**
 * Abuse Dashboard - Loading State Component
 */

import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
        <span className="text-slate-600">Loading dashboard...</span>
      </div>
    </div>
  )
}

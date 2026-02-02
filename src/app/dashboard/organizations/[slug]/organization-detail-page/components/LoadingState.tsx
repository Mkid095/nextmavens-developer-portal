/**
 * Organization Detail Page - Loading State Component
 */

import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-900 animate-spin" />
    </div>
  )
}

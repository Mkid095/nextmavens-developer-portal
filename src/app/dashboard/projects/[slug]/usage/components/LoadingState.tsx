/**
 * Loading State Component
 * Displays loading spinner for usage dashboard
 */

'use client'

import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )
}

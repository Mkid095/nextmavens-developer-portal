/**
 * LogsPageLoading Component
 *
 * Loading state for the logs page.
 */

'use client'

import React from 'react'

export function LogsPageLoading() {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600">Loading project...</span>
      </div>
    </div>
  )
}

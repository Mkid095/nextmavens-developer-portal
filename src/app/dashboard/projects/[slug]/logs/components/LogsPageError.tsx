/**
 * LogsPageError Component
 *
 * Error state for the logs page.
 */

'use client'

import React from 'react'
import Link from 'next/link'

interface LogsPageErrorProps {
  error: string | null
}

export function LogsPageError({ error }: LogsPageErrorProps) {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 mb-2">Project not found</p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-800">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

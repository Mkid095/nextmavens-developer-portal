/**
 * LogsPageHeader Component
 *
 * Header navigation for the logs page.
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Project } from '../types'

interface LogsPageHeaderProps {
  project: Project
  connecting?: boolean
}

export function LogsPageHeader({ project, connecting = false }: LogsPageHeaderProps) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/projects/${project.slug}`}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Logs</h1>
              <p className="text-xs text-slate-500">{project.name}</p>
            </div>
          </div>
          {connecting && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

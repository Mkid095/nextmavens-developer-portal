/**
 * Changelog - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, FileText, Rss } from 'lucide-react'

interface HeaderProps {
  onDownloadRSS: () => void
}

export function Header({ onDownloadRSS }: HeaderProps) {
  return (
    <>
      <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Docs
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <FileText className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Changelog</h1>
            <p className="text-slate-600">Track the latest updates, improvements, and fixes</p>
          </div>
        </div>
        <button
          onClick={onDownloadRSS}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          <Rss className="w-4 h-4" />
          Subscribe to RSS
        </button>
      </div>
    </>
  )
}

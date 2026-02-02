/**
 * Trace Navigation Component
 * Top navigation bar for traces page
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function TraceNavigation() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Request Traces</h1>
              <p className="text-xs text-slate-500">Debug request flow across services</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

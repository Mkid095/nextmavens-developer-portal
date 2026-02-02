/**
 * Organization Detail Page - Not Found State Component
 */

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export function NotFoundState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Organization Not Found</h2>
        <p className="text-slate-600 mb-6">The organization you're looking for doesn't exist.</p>
        <Link
          href="/dashboard/organizations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>
      </div>
    </div>
  )
}

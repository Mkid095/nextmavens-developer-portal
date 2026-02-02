/**
 * Errors Documentation - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export function Header() {
  return (
    <>
      <div className="mb-8">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>
      </div>

      <div className="max-w-4xl mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-700" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-900">Error Codes Reference</h1>
        </div>
        <p className="text-xl text-slate-600">
          Complete reference for all error codes returned by the NextMavens API. Each error includes the
          code, HTTP status, retryability, common causes, and solutions.
        </p>
      </div>
    </>
  )
}

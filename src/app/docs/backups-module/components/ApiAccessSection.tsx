/**
 * Backups Documentation - API Access Section Component
 */

import Link from 'next/link'
import { DatabaseBackup } from 'lucide-react'

export function ApiAccessSection() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">API Access</h2>
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <p className="text-slate-600 mb-4">
          Access backup functionality through your project dashboard or directly via API endpoints.
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard/backups"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
          >
            <DatabaseBackup className="w-4 h-4" />
            Go to Backup Dashboard
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            View API Documentation
          </Link>
        </div>
      </div>
    </section>
  )
}

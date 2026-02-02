/**
 * Backups Documentation - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, DatabaseBackup } from 'lucide-react'

export function Header() {
  return (
    <>
      <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Docs
      </Link>

      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <DatabaseBackup className="w-6 h-6 text-blue-700" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-900">Backup Strategy</h1>
        </div>
        <p className="text-xl text-slate-600 mb-12">
          Comprehensive backup solution for database, storage, and logs with Telegram integration for secure,
          long-term archival and easy restore capabilities.
        </p>
      </div>
    </>
  )
}

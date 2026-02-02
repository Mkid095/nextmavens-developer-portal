/**
 * Storage Documentation - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, HardDrive } from 'lucide-react'

export function Header() {
  return (
    <>
      <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Docs
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-xl">
          <HardDrive className="w-6 h-6 text-orange-700" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Telegram Storage</h1>
          <p className="text-slate-600">File storage via Telegram with CDN access</p>
        </div>
      </div>
    </>
  )
}

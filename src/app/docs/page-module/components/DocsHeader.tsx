/**
 * Docs Main Page - Module - Header Component
 */

import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function DocsHeader() {
  return (
    <div className="max-w-3xl mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <BookOpen className="w-6 h-6 text-emerald-700" />
        </div>
        <h1 className="text-4xl font-semibold text-slate-900">Documentation</h1>
      </div>
      <p className="text-xl text-slate-600 mb-4">
        Complete guide to the NextMavens platform. Learn how to use our APIs, services, and tools.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Base URL:</strong>{' '}
          <code className="bg-white px-2 py-1 rounded">https://api.nextmavens.cloud</code>
        </p>
      </div>
    </div>
  )
}

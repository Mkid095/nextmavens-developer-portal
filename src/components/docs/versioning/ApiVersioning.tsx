'use client'

import { Code2, BookOpen, Github, FileText as FileTextIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function ApiVersioning() {
  return (
    <section id="api-versioning" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔌</span>
        <h2 className="text-2xl font-semibold text-slate-900">API Versioning</h2>
      </div>

      <p className="text-slate-600 mb-6">
        The NextMavens API uses URL path versioning to ensure backward compatibility as the platform evolves.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Version Prefix</h3>
          <p className="text-sm text-slate-600 mb-3">All API requests include the version number in the URL path:</p>
          <CodeBlockWithCopy>{`https://api.nextmavens.cloud/v1/projects`}</CodeBlockWithCopy>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Version Header</h3>
          <p className="text-sm text-slate-600 mb-3">Alternatively, use the <code className="bg-slate-100 px-2 py-1 rounded">X-API-Version</code> header:</p>
          <CodeBlockWithCopy>{`X-API-Version: 1`}</CodeBlockWithCopy>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">When Versions Change</h3>
        <p className="text-sm text-blue-800">
          New API versions are introduced when breaking changes are required. The current version is v1.
          When v2 is released, v1 will continue to work for at least 12 months with deprecation notices.
        </p>
      </div>
    </section>
  )
}

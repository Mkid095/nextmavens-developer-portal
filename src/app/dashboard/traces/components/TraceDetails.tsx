/**
 * Trace Details Component
 * Displays basic trace information
 */

import Link from 'next/link'
import { Calendar, ExternalLink } from 'lucide-react'
import type { RequestTrace } from '../types'
import { formatDate, METHOD_COLORS } from '../utils'

interface TraceDetailsProps {
  trace: RequestTrace
}

export function TraceDetails({ trace }: TraceDetailsProps) {
  const methodColor = METHOD_COLORS[trace.method] || 'bg-slate-100 text-slate-700'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Request Details</h2>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(trace.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${methodColor}`}>
            {trace.method}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Request ID
          </label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-sm text-slate-900 bg-slate-100 px-3 py-2 rounded font-mono break-all">
              {trace.request_id}
            </code>
            <button
              onClick={() => copyToClipboard(trace.request_id)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
              title="Copy to clipboard"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Project ID
          </label>
          <div className="mt-1">
            <code className="text-sm text-slate-900 bg-slate-100 px-3 py-2 rounded font-mono">
              {trace.project_id}
            </code>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Request Path
          </label>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-sm text-slate-900 bg-slate-100 px-3 py-2 rounded font-mono break-all flex-1">
              {trace.path}
            </code>
            <Link
              href={trace.path}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

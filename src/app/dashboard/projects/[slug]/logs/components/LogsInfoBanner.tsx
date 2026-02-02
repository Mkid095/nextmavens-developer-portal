/**
 * LogsInfoBanner Component
 *
 * Informational banner about real-time log streaming.
 */

'use client'

import React from 'react'
import { Info } from 'lucide-react'

export function LogsInfoBanner() {
  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Real-time Log Streaming</p>
          <p>
            Logs are streaming in real-time via Server-Sent Events (SSE). Use the filters above to narrow down
            logs by service, level, and date range. Logs are retained for 30 days and can be downloaded for
            offline analysis.
          </p>
        </div>
      </div>
    </div>
  )
}

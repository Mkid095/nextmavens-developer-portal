/**
 * Deletion Preview Modal - Dependencies Component
 */

import { Info } from 'lucide-react'
import { ICON_MAP, TYPE_LABELS } from '../constants'
import type { DeletionPreviewData } from '../types'

interface DependenciesProps {
  preview: DeletionPreviewData
}

export function Dependencies({ preview }: DependenciesProps) {
  if (preview.dependencies.length === 0) {
    return null
  }

  return (
    <div>
      <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
        <Info className="w-4 h-4" />
        Dependencies and Impact
      </h4>
      <div className="space-y-2">
        {preview.dependencies.map((dep, index) => {
          const Icon = ICON_MAP[dep.type as keyof typeof ICON_MAP] || Info
          const label = TYPE_LABELS[dep.type] || dep.type
          return (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 truncate font-mono">{dep.target}</p>
                <p className="text-sm text-red-600 mt-1">{dep.impact}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

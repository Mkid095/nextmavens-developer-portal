/**
 * Abuse Dashboard - Suspensions By Type Component
 */

import { Shield } from 'lucide-react'
import { formatCapType } from '../utils'

interface SuspensionsByTypeProps {
  suspensionsByType: Record<string, number>
}

export function SuspensionsByType({ suspensionsByType }: SuspensionsByTypeProps) {
  if (Object.keys(suspensionsByType).length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No suspensions in this time range</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {Object.entries(suspensionsByType).map(([capType, count]) => (
        <div key={capType} className="p-4 bg-slate-50 rounded-lg text-center">
          <div className="text-2xl font-semibold text-slate-900 mb-1">{count}</div>
          <div className="text-sm text-slate-600">{formatCapType(capType)}</div>
        </div>
      ))}
    </div>
  )
}

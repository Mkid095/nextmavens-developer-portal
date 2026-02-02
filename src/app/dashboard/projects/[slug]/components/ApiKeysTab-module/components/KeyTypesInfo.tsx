/**
 * API Keys Tab - Key Types Info Component
 */

import { Key } from 'lucide-react'
import { KEY_TYPE_DESCRIPTIONS } from '../constants'

export function KeyTypesInfo() {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-3">Understanding API Key Types</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(KEY_TYPE_DESCRIPTIONS).map(([type, info]) => (
          <div key={type} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className={`w-4 h-4 text-${info.color}-600`} />
              <h4 className="font-medium text-slate-900">{info.title}</h4>
            </div>
            <p className="text-sm text-slate-600 mb-2">{info.description}</p>
            <p className="text-xs text-slate-500">
              <strong>Use for:</strong> {info.useFor}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

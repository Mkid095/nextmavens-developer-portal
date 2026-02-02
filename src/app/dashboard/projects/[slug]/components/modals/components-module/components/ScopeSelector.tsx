/**
 * Modal Components - Module - Scope Selector Component
 */

import { Info } from 'lucide-react'
import type { ScopeSelectorProps } from '../types'
import { SCOPES_BY_SERVICE, SCOPE_DESCRIPTIONS } from '../../../types'

export function ScopeSelector({ scopes, onScopeToggle, showScopeDetails }: ScopeSelectorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-slate-700">Permissions (Scopes)</label>
        <button
          type="button"
          onClick={() => {}}
          className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          {showScopeDetails ? 'Hide' : 'Show'} details
        </button>
      </div>
      <div className="space-y-3">
        {Object.entries(SCOPES_BY_SERVICE).map(([service, serviceScopes]) => (
          <div key={service} className="border border-slate-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-900 mb-2">{service}</h4>
            <div className="grid grid-cols-2 gap-2">
              {serviceScopes.map((scope) => (
                <label
                  key={scope}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                    scopes.includes(scope) ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={() => onScopeToggle(scope)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-slate-700">{scope}</span>
                    {showScopeDetails && SCOPE_DESCRIPTIONS[scope] && (
                      <p className="text-xs text-slate-500 mt-0.5">{SCOPE_DESCRIPTIONS[scope]}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">{scopes.length} scope(s) selected</p>
    </div>
  )
}

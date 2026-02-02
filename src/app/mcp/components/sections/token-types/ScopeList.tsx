/**
 * Scope List
 *
 * Displays a list of scopes for a token type.
 */

import type { TokenScope } from '../../../../types'

interface ScopeListProps {
  scopes: TokenScope[]
}

export function ScopeList({ scopes }: ScopeListProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Scopes</h3>
      <div className="flex flex-wrap gap-2">
        {scopes.slice(0, 6).map((s) => (
          <div key={s.scope} className={`px-4 py-2 rounded-lg ${s.disabled ? 'bg-slate-50 opacity-60' : 'bg-slate-100'}`}>
            <code className={`text-sm font-mono ${s.disabled ? 'text-slate-500' : 'text-slate-900'}`}>{s.scope}</code>
            <p className={`text-xs mt-1 ${s.disabled ? 'text-slate-500' : 'text-slate-600'}`}>{s.desc}</p>
          </div>
        ))}
      </div>
      {scopes.length > 6 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {scopes.slice(6).map((s) => (
            <div key={s.scope} className={`px-4 py-2 rounded-lg ${s.disabled ? 'bg-slate-50 opacity-60' : 'bg-slate-100'}`}>
              <code className={`text-sm font-mono ${s.disabled ? 'text-slate-500' : 'text-slate-900'}`}>{s.scope}</code>
              <p className={`text-xs mt-1 ${s.disabled ? 'text-slate-500' : 'text-slate-600'}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

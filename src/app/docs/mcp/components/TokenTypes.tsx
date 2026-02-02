/**
 * MCP Token Types Component
 */

import { tokenTypes as tokenTypesConfig } from '../constants'

interface TokenTypesProps {
  colorClasses: Record<string, string>
}

export function TokenTypes({ colorClasses }: TokenTypesProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      {tokenTypesConfig.map((token) => (
        <TokenCard key={token.type} token={token} colorClasses={colorClasses} />
      ))}
    </div>
  )
}

interface TokenCardProps {
  token: { type: string; name: string; color: string; scopes: string[]; description: string }
  colorClasses: Record<string, string>
}

function TokenCard({ token, colorClasses }: TokenCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`p-4 border-b border-slate-200 ${colorClasses[token.color]}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-slate-900">{token.name}</h3>
            <code className="text-xs bg-white px-2 py-0.5 rounded font-mono mt-1">{token.type}</code>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-slate-600 mb-4">{token.description}</p>
        <div>
          <h4 className="text-xs font-medium text-slate-700 mb-2">Scopes:</h4>
          <div className="flex flex-wrap gap-1">
            {token.scopes.map((scope) => (
              <span key={scope} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                {scope}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

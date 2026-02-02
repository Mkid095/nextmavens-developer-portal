/**
 * Compatible AI Tools Component
 */

import { compatibleAITools } from '../constants'

export function CompatibleAITools() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Compatible AI Tools</h2>
      <p className="text-sm text-slate-600 mb-6">
        NextMavens MCP works with any AI tool that supports the Model Context Protocol:
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {compatibleAITools.map((tool) => (
          <AIToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </div>
  )
}

interface AIToolCardProps {
  tool: { name: string; description: string; recommended: string }
}

function AIToolCard({ tool }: AIToolCardProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <h3 className="font-medium text-slate-900 mb-2">{tool.name}</h3>
      <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
        Recommended: {tool.recommended}
      </span>
    </div>
  )
}

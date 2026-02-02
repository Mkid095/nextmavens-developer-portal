/**
 * MCP Tool Category Component
 */

import { ToolCategory as TCategory } from '../constants'
import { ToolInputSchema } from './ToolInputSchema'

interface ToolCategoryProps {
  category: TCategory
}

export function ToolCategory({ category }: ToolCategoryProps) {
  return (
    <div key={category.category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        {category.icon && <category.icon className="w-5 h-5 text-slate-700" />}
        <h3 className="font-semibold text-slate-900">{category.category}</h3>
        <span className="text-xs text-slate-500 ml-auto">{category.tools.length} tools</span>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {category.tools.map((tool) => (
            <ToolItem key={tool.name} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ToolItemProps {
  tool: { name: string; description: string; inputSchema: any; scopes: string[] }
}

function ToolItem({ tool }: ToolItemProps) {
  return (
    <div className="border-b border-slate-100 pb-4 last:pb-0 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <code className="text-sm font-mono text-blue-700">{tool.name}</code>
          <p className="text-sm text-slate-600 mt-1">{tool.description}</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {tool.scopes.map((scope) => (
            <span key={scope} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
              {scope}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-slate-50 rounded p-3">
        <div className="text-xs text-slate-500 mb-1">Parameters:</div>
        <ToolInputSchema schema={tool.inputSchema} />
      </div>
    </div>
  )
}

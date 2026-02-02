/**
 * Modal Components - Module - MCP Access Level Selector Component
 */

import { Eye, RefreshCw, ShieldAlert } from 'lucide-react'
import type { McpAccessLevelSelectorProps, McpAccessLevel } from '../types'
import { MCP_ACCESS_LEVEL_CONFIG, MCP_ACCESS_LEVEL_SCOPES } from '../constants'

const ICONS = {
  Eye,
  RefreshCw,
  ShieldAlert,
} as const

export function McpAccessLevelSelector({
  mcpAccessLevel,
  onAccessLevelChange,
}: McpAccessLevelSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">MCP Access Level</label>
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(MCP_ACCESS_LEVEL_CONFIG) as McpAccessLevel[]).map((level) => {
          const config = MCP_ACCESS_LEVEL_CONFIG[level]
          const Icon = ICONS[level]
          const isSelected = mcpAccessLevel === level
          const colorClasses = {
            teal: 'border-teal-500 bg-teal-50',
            amber: 'border-amber-500 bg-amber-50',
            red: 'border-red-500 bg-red-50',
          }[config.color]

          return (
            <button
              key={level}
              type="button"
              onClick={() => onAccessLevelChange(level, MCP_ACCESS_LEVEL_SCOPES[level])}
              className={`p-3 rounded-xl border-2 text-left transition ${
                isSelected ? colorClasses : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 text-${config.color}-600`} />
                <h4 className="font-semibold text-slate-900 text-sm">{config.name}</h4>
              </div>
              <p className="text-xs text-slate-600">{config.description}</p>
              <p className="text-xs text-slate-500 mt-1">{config.scopes}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

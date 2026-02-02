/**
 * MCP Service Info Component
 */

import { mcpConfig } from '../constants'

export function McpServiceInfo() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">MCP Server Information</h2>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Install Command</span>
          </div>
          <code className="text-xs text-blue-700 break-all">{mcpConfig.installCommand}</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">API Gateway</span>
          </div>
          <code className="text-xs text-blue-700 break-all">{mcpConfig.gatewayDomain}</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Available Tools</span>
          </div>
          <p className="text-xs text-slate-700">{mcpConfig.toolsCount} tools across 9 categories</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">NPM Package</span>
          </div>
          <code className="text-xs text-blue-700 break-all">{mcpConfig.mcpServerPackage}</code>
        </div>
      </div>
    </div>
  )
}

import { Terminal, Server, Zap, Globe } from 'lucide-react'

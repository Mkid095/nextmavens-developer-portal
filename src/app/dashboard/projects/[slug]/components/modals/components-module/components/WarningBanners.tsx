/**
 * Modal Components - Module - Warning Banners Component
 */

import { ShieldAlert, AlertCircle, Info } from 'lucide-react'
import type { WarningBannersProps } from '../types'

export function WarningBanners({ keyType, mcpAccessLevel, config }: WarningBannersProps) {
  if (keyType === 'service_role') {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Service Role Key Warning</h4>
            <p className="text-sm text-red-800">{config.warning}</p>
          </div>
        </div>
      </div>
    )
  }

  if (keyType === 'secret') {
    return (
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Secret Key Warning</h4>
            <p className="text-sm text-amber-800">{config.warning}</p>
          </div>
        </div>
      </div>
    )
  }

  if (keyType === 'public') {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Public Key</h4>
            <p className="text-sm text-blue-800">{config.warning}</p>
          </div>
        </div>
      </div>
    )
  }

  if (keyType === 'mcp' && (mcpAccessLevel === 'rw' || mcpAccessLevel === 'admin')) {
    return (
      <div
        className={`mb-6 p-4 border rounded-lg ${
          mcpAccessLevel === 'admin' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              mcpAccessLevel === 'admin' ? 'text-red-600' : 'text-amber-600'
            }`}
          />
          <div>
            <h4
              className={`font-semibold mb-1 ${
                mcpAccessLevel === 'admin' ? 'text-red-900' : 'text-amber-900'
              }`}
            >
              {mcpAccessLevel === 'admin' ? 'Admin MCP Token Warning' : 'Write Access Warning'}
            </h4>
            <p
              className={`text-sm ${
                mcpAccessLevel === 'admin' ? 'text-red-800' : 'text-amber-800'
              }`}
            >
              {mcpAccessLevel === 'admin'
                ? 'This AI has full administrative access including deletion and user management. Only grant to trusted AI ops tools in secure environments.'
                : 'This AI can modify your data. Only grant to trusted systems.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (keyType === 'mcp' && mcpAccessLevel === 'ro') {
    return (
      <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-teal-900 mb-1">Read-Only MCP Token</h4>
            <p className="text-sm text-teal-800">
              This token has read-only access and is safe for AI assistants and code generation tools.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

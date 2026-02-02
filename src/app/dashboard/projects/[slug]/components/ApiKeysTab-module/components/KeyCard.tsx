/**
 * API Keys Tab - Key Card Component
 */

import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  RefreshCw,
  ShieldAlert,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { getMcpTokenInfo } from '../../../types'
import { formatLastUsed } from '../../../hooks'
import type { KeyCardProps } from '../types'

export function KeyCard({
  key: apiKey,
  displayKey,
  isNewKey,
  hasFullKey,
  usageStats,
  loadingStats,
  inactive,
  copied,
  showSecret,
  showSecretState,
  onToggleSecret,
  onCopy,
  canManageKeys,
  onOpenRotate,
  onOpenRevoke,
  onDeleteKey,
}: KeyCardProps) {
  const mcpInfo = getMcpTokenInfo(displayKey.key_prefix, displayKey.key_type)

  const displayValue =
    displayKey.key_type === 'secret' && !showSecretState[apiKey.id]
      ? `${displayKey.key_prefix}••••••••`
      : hasFullKey
      ? displayKey.public_key
      : `${displayKey.key_prefix}•••••••• (recreate)`

  return (
    <div
      className={`p-4 rounded-lg border ${
        inactive ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-slate-900">{displayKey.name}</span>
            <span
              className={`px-2 py-0.5 ${mcpInfo.bgColor} ${mcpInfo.textColor} text-xs rounded-full flex items-center gap-1`}
            >
              <mcpInfo.icon className="w-3 h-3" />
              {mcpInfo.label}
            </span>
            {mcpInfo.showWarning && (
              <span
                className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1"
                title="This token can modify your data"
              >
                <AlertCircle className="w-3 h-3" />
                Write Access
              </span>
            )}
            {isNewKey && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                New
              </span>
            )}
            {inactive && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Inactive
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="text-sm text-slate-600 bg-white px-2 py-1 rounded">
                {displayValue}
              </code>
              {displayKey.key_type === 'secret' && hasFullKey && (
                <button
                  onClick={() => onToggleSecret(apiKey.id)}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  {showSecretState[apiKey.id] ? (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              )}
              <button
                onClick={() =>
                  onCopy(hasFullKey ? displayKey.public_key : displayKey.key_prefix, `key-${apiKey.id}`)
                }
                className="p-1 hover:bg-slate-200 rounded"
              >
                {copied === `key-${apiKey.id}` ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Created {new Date(apiKey.created_at).toLocaleString()}
              {!hasFullKey && (
                <span className="text-amber-600 ml-2"> • Only prefix stored - recreate key</span>
              )}
            </p>
            {!loadingStats && usageStats && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>
                      Used <strong className="text-slate-900">{usageStats.usageCount.toLocaleString()}</strong>{' '}
                      times
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Last:{' '}
                      <strong className="text-slate-900">{formatLastUsed(usageStats.lastUsed)}</strong>
                    </span>
                  </div>
                  {usageStats.successErrorRate.total > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          usageStats.successErrorRate.successRate >= 95
                            ? 'text-emerald-600'
                            : usageStats.successErrorRate.successRate >= 80
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }
                      >
                        <strong>{usageStats.successErrorRate.successRate}%</strong> success
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{usageStats.successErrorRate.total} requests</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canManageKeys && (
            <>
              <button
                onClick={() => onOpenRotate(apiKey.id)}
                disabled={apiKey.status === 'revoked' || apiKey.status === 'expired'}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rotate key"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenRevoke(apiKey.id)}
                disabled={apiKey.status === 'revoked' || apiKey.status === 'expired'}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Revoke key"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteKey(apiKey.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  BarChart3,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { McpUsageAnalytics } from '@/components/McpUsageAnalytics'
import { getMcpTokenInfo } from '../types'
import type { ApiKey, NewKeyResponse, KeyUsageStats } from '../types'
import { isKeyInactive, formatLastUsed } from '../hooks'

interface ApiKeysTabProps {
  project: { id: string }
  apiKeys: ApiKey[]
  newKey: NewKeyResponse | null
  keyUsageStats: Record<string, KeyUsageStats>
  usageStatsLoading: Record<string, boolean>
  copied: string | null
  canManageKeys: boolean
  onCopy: (text: string, id: string) => void
  onCreateKey: () => void
  onOpenRotate: (keyId: string) => void
  onOpenRevoke: (keyId: string) => void
  onDeleteKey: (keyId: string) => void
  onToggleShowSecret: (keyId: string) => void
  showSecret: Record<string, boolean>
  onCloseNewKey: () => void
  onOpenUsageExamples: () => void
}

export function ApiKeysTab({
  project,
  apiKeys,
  newKey,
  keyUsageStats,
  usageStatsLoading,
  copied,
  canManageKeys,
  onCopy,
  onCreateKey,
  onOpenRotate,
  onOpenRevoke,
  onDeleteKey,
  onToggleShowSecret,
  showSecret,
  onCloseNewKey,
  onOpenUsageExamples,
}: ApiKeysTabProps) {
  const [showSecretState, setShowSecretState] = useState<Record<string, boolean>>({})

  const handleToggleSecret = (keyId: string) => {
    setShowSecretState((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
    onToggleShowSecret(keyId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
        {canManageKeys && (
          <button
            onClick={onCreateKey}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Key</span>
          </button>
        )}
      </div>

      {/* US-007: API Keys guidance section */}
      <div className="mb-6 space-y-4">
        {/* Key Types Explained */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Understanding API Key Types</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <h4 className="font-medium text-slate-900">publishable</h4>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Safe for client-side code. Can only read data and create resources.
              </p>
              <p className="text-xs text-slate-500">
                <strong>Use for:</strong> Frontend apps, mobile apps, public APIs
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-slate-900">secret</h4>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Full access to all operations. Never expose in client-side code.
              </p>
              <p className="text-xs text-slate-500">
                <strong>Use for:</strong> Backend servers, CLI tools, scripts
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-purple-600" />
                <h4 className="font-medium text-slate-900">service_role</h4>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Bypasses row-level security. Use with extreme caution.
              </p>
              <p className="text-xs text-slate-500">
                <strong>Use for:</strong> Admin tasks, migrations, trusted services
              </p>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Security Best Practices</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Never commit API keys to public repositories</li>
                <li>• Use environment variables to store keys</li>
                <li>• Rotate keys regularly (use the rotate button)</li>
                <li>• Revoke unused keys immediately</li>
                <li>• Use <strong>publishable</strong> keys in frontend code only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Integration Code */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
          <h3 className="font-semibold text-emerald-900 mb-3">Quick Integration</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Using Fetch API</p>
              <div className="relative group">
                <button
                  onClick={() =>
                    onCopy(
                      `const response = await fetch('https://api.nextmavens.cloud/api/projects/${project.id}/users', {
  headers: {
    'X-API-Key': process.env.NEXTMAVENS_API_KEY
  }
})
const data = await response.json()`,
                      'sdk-integration'
                    )
                  }
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  {copied === 'sdk-integration' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono">{`const response = await fetch('https://api.nextmavens.cloud/api/projects/${project.id}/users', {
  headers: {
    'X-API-Key': process.env.NEXTMAVENS_API_KEY
  }
})
const data = await response.json()`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {newKey && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-emerald-900">New API Key Created</h3>
              <p className="text-sm text-emerald-700">
                Copy these keys now. You won&apos;t see the secret key again.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenUsageExamples}
                className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
              >
                View Usage Examples
              </button>
              <button onClick={onCloseNewKey} className="text-emerald-600 hover:text-emerald-800">
                Close
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
              <div className="flex gap-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 break-all">
                  {newKey.apiKey.public_key}
                </code>
                <button
                  onClick={() => onCopy(newKey.apiKey.public_key, 'new-public')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50"
                >
                  {copied === 'new-public' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
            {newKey.secretKey && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 break-all">
                    {newKey.secretKey}
                  </code>
                  <button
                    onClick={() => onCopy(newKey.secretKey!, 'new-secret')}
                    className="px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50"
                  >
                    {copied === 'new-secret' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No API keys yet</p>
          {canManageKeys && (
            <button
              onClick={onCreateKey}
              className="mt-4 text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Create your first API key
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => {
            const isNewKey = newKey && newKey.apiKey.id === key.id
            const displayKey = isNewKey ? newKey.apiKey : key
            const hasFullKey = isNewKey || (key.public_key && key.public_key.length > 20)
            const usageStats = keyUsageStats[key.id]
            const loadingStats = usageStatsLoading[key.id]
            const inactive = isKeyInactive(key)
            const mcpInfo = getMcpTokenInfo(displayKey.key_prefix, displayKey.key_type)

            return (
              <div
                key={key.id}
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
                          {displayKey.key_type === 'secret' && !showSecretState[key.id]
                            ? `${displayKey.key_prefix}••••••••`
                            : hasFullKey
                            ? displayKey.public_key
                            : `${displayKey.key_prefix}•••••••• (recreate)`}
                        </code>
                        {displayKey.key_type === 'secret' && hasFullKey && (
                          <button
                            onClick={() => handleToggleSecret(key.id)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            {showSecretState[key.id] ? (
                              <EyeOff className="w-4 h-4 text-slate-600" />
                            ) : (
                              <Eye className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => onCopy(hasFullKey ? displayKey.public_key : displayKey.key_prefix, `key-${key.id}`)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {copied === `key-${key.id}` ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Created {new Date(key.created_at).toLocaleString()}
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
                          onClick={() => onOpenRotate(key.id)}
                          disabled={key.status === 'revoked' || key.status === 'expired'}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rotate key"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenRevoke(key.id)}
                          disabled={key.status === 'revoked' || key.status === 'expired'}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Revoke key"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteKey(key.id)}
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
          })}
        </div>
      )}

      {/* US-011: MCP Usage Analytics Section */}
      {apiKeys.some((key) => key.key_type === 'mcp') && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <McpUsageAnalytics projectId={project.id} />
        </div>
      )}
    </div>
  )
}

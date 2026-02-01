import { useState, FormEvent } from 'react'
import { X, Plus, Info, ShieldAlert, AlertCircle, Eye, RefreshCw } from 'lucide-react'
import { KEY_TYPE_CONFIG, SCOPES_BY_SERVICE, SCOPE_DESCRIPTIONS, type KeyType, type McpAccessLevel } from '../../types'

interface CreateApiKeyModalProps {
  isOpen: boolean
  isSubmitting: boolean
  keyError: string
  onClose: () => void
  onSubmit: (data: {
    name: string
    keyType: KeyType
    environment: 'live' | 'test' | 'dev'
    scopes: string[]
    mcpAccessLevel: McpAccessLevel
  }) => Promise<void>
}

export function CreateApiKeyModal({
  isOpen,
  isSubmitting,
  keyError,
  onClose,
  onSubmit,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState('')
  const [keyType, setKeyType] = useState<KeyType>('public')
  const [environment, setEnvironment] = useState<'live' | 'test' | 'dev'>('live')
  const [scopes, setScopes] = useState<string[]>(KEY_TYPE_CONFIG.public.defaultScopes)
  const [mcpAccessLevel, setMcpAccessLevel] = useState<McpAccessLevel>('ro')
  const [showScopeDetails, setShowScopeDetails] = useState(false)

  if (!isOpen) return null

  const handleKeyTypeChange = (newKeyType: KeyType) => {
    setKeyType(newKeyType)
    setScopes(KEY_TYPE_CONFIG[newKeyType].defaultScopes)
  }

  const handleScopeToggle = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    if (scopes.length === 0) {
      return
    }

    await onSubmit({
      name: name.trim(),
      keyType,
      environment,
      scopes,
      mcpAccessLevel,
    })

    setName('')
    setKeyType('public')
    setEnvironment('live')
    setScopes(KEY_TYPE_CONFIG.public.defaultScopes)
    setMcpAccessLevel('ro')
    setShowScopeDetails(false)
  }

  const handleMcpAccessLevelChange = (level: McpAccessLevel, defaultScopes: string[]) => {
    setMcpAccessLevel(level)
    setScopes(defaultScopes)
  }

  const config = KEY_TYPE_CONFIG[keyType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create API Key</h2>
            <p className="text-sm text-slate-600 mt-1">Choose the right key type for your use case</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Key Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">API Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Web App"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Step 2: Key Type Selector Cards */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Select Key Type</label>
            <div className="grid md:grid-cols-2 gap-3">
              {(Object.keys(KEY_TYPE_CONFIG) as KeyType[]).map((type) => {
                const typeConfig = KEY_TYPE_CONFIG[type]
                const IconComponent = typeConfig.icon
                const isSelected = keyType === type

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleKeyTypeChange(type)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      isSelected
                        ? `border-${typeConfig.color}-500 bg-${typeConfig.color}-50`
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          typeConfig.color === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : typeConfig.color === 'purple'
                            ? 'bg-purple-100 text-purple-700'
                            : typeConfig.color === 'red'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{typeConfig.name}</h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              typeConfig.riskLevel === 'Low'
                                ? 'bg-green-100 text-green-700'
                                : typeConfig.riskLevel === 'Medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : typeConfig.riskLevel === 'High'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {typeConfig.riskLevel} Risk
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{typeConfig.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {typeConfig.useCases.slice(0, 2).map((useCase) => (
                            <span key={useCase} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {useCase}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* MCP Access Level Selector */}
          {keyType === 'mcp' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">MCP Access Level</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleMcpAccessLevelChange('ro', ['db:select', 'storage:read', 'realtime:subscribe'])
                  }
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    mcpAccessLevel === 'ro'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-teal-600" />
                    <h4 className="font-semibold text-slate-900 text-sm">Read-Only</h4>
                  </div>
                  <p className="text-xs text-slate-600">Safe for AI assistants</p>
                  <p className="text-xs text-slate-500 mt-1">db:select, storage:read</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleMcpAccessLevelChange('rw', [
                      'db:select',
                      'db:insert',
                      'db:update',
                      'storage:read',
                      'storage:write',
                      'realtime:subscribe',
                      'graphql:execute',
                    ])
                  }
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    mcpAccessLevel === 'rw'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <h4 className="font-semibold text-slate-900 text-sm">Read-Write</h4>
                  </div>
                  <p className="text-xs text-slate-600">Can modify data</p>
                  <p className="text-xs text-slate-500 mt-1">+ insert, update, write</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleMcpAccessLevelChange('admin', [
                      'db:select',
                      'db:insert',
                      'db:update',
                      'db:delete',
                      'storage:read',
                      'storage:write',
                      'realtime:subscribe',
                      'realtime:publish',
                      'graphql:execute',
                      'auth:manage',
                    ])
                  }
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    mcpAccessLevel === 'admin'
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold text-slate-900 text-sm">Admin</h4>
                  </div>
                  <p className="text-xs text-slate-600">Full access</p>
                  <p className="text-xs text-slate-500 mt-1">+ delete, auth, publish</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Environment Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'live' | 'test' | 'dev')}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
            >
              <option value="live">Production (Live)</option>
              <option value="test">Staging (Test)</option>
              <option value="dev">Development (Dev)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              The key prefix will include this environment (e.g., pk_live_, pk_test_, pk_dev_)
            </p>
          </div>

          {/* Step 4: Scope Checkboxes */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">Permissions (Scopes)</label>
              <button
                type="button"
                onClick={() => setShowScopeDetails(!showScopeDetails)}
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
                          onChange={() => handleScopeToggle(scope)}
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

          {/* Warnings */}
          {keyType === 'service_role' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Service Role Key Warning</h4>
                  <p className="text-sm text-red-800">{config.warning}</p>
                </div>
              </div>
            </div>
          )}

          {keyType === 'secret' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Secret Key Warning</h4>
                  <p className="text-sm text-amber-800">{config.warning}</p>
                </div>
              </div>
            </div>
          )}

          {keyType === 'public' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Public Key</h4>
                  <p className="text-sm text-blue-800">{config.warning}</p>
                </div>
              </div>
            </div>
          )}

          {keyType === 'mcp' && (mcpAccessLevel === 'rw' || mcpAccessLevel === 'admin') && (
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
          )}

          {keyType === 'mcp' && mcpAccessLevel === 'ro' && (
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
          )}

          {keyError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{keyError}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> You will only see your secret key once. Make sure to copy it and
              store it securely.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || scopes.length === 0}
              className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Key
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

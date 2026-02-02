/**
 * Create API Key Modal - Main Component
 */

import { X, Plus, AlertCircle } from 'lucide-react'
import type { CreateApiKeyModalProps } from '../types'
import { useCreateApiKeyForm } from '../use-form'
import { KeyTypeSelector, McpAccessLevelSelector, ScopeSelector, WarningBanners } from '../components'

export function CreateApiKeyModal({
  isOpen,
  isSubmitting,
  keyError,
  onClose,
  onSubmit,
}: CreateApiKeyModalProps) {
  const { form, setters, resetForm } = useCreateApiKeyForm()

  const {
    name,
    keyType,
    environment,
    scopes,
    mcpAccessLevel,
    showScopeDetails,
  } = form

  const {
    setName,
    setKeyType,
    setEnvironment,
    setMcpAccessLevel,
    setShowScopeDetails,
  } = setters

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || scopes.length === 0) {
      return
    }

    await onSubmit({
      name: name.trim(),
      keyType,
      environment,
      scopes,
      mcpAccessLevel,
    })

    resetForm()
  }

  const config = keyType === 'mcp' ? { warning: '' } : { warning: '' }

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
          <KeyTypeSelector keyType={keyType} onKeyTypeChange={setKeyType} />

          {/* MCP Access Level Selector */}
          {keyType === 'mcp' && (
            <McpAccessLevelSelector
              mcpAccessLevel={mcpAccessLevel}
              onAccessLevelChange={(level, scopes) => {
                setMcpAccessLevel(level)
                setters.setScopes(scopes)
              }}
            />
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
          <ScopeSelector
            scopes={scopes}
            onScopeToggle={setters.setScopes}
            showScopeDetails={showScopeDetails}
          />

          {/* Warnings */}
          <WarningBanners keyType={keyType} mcpAccessLevel={mcpAccessLevel} config={config} />

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

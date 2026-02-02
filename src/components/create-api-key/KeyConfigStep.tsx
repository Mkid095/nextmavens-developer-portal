/**
 * Key Configuration Step Component
 *
 * Step 2: Configure key name, environment, and scopes.
 */

'use client'

import { Database, HardDrive, Lock, Eye, Sparkles, AlertTriangle } from 'lucide-react'
import { getKeyPrefix, SCOPES_BY_SERVICE } from '@/lib/types/api-key.types'
import type { ApiKeyEnvironment, ApiKeyScope } from '@/lib/types/api-key.types'
import type { KeyTypeOption } from './types'
import { ENVIRONMENT_OPTIONS, MCP_ACCESS_LEVELS } from './constants'

interface KeyConfigStepProps {
  selectedKeyType: KeyTypeOption
  keyName: string
  environment: ApiKeyEnvironment
  selectedScopes: ApiKeyScope[]
  mcpAccessLevel: 'ro' | 'rw' | 'admin'
  error: string
  submitting: boolean
  onKeyNameChange: (name: string) => void
  onEnvironmentChange: (env: ApiKeyEnvironment) => void
  onScopeToggle: (scope: ApiKeyScope) => void
  onMcpAccessLevelChange: (level: 'ro' | 'rw' | 'admin') => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onResetConfirmations: () => void
}

export function KeyConfigStep({
  selectedKeyType,
  keyName,
  environment,
  selectedScopes,
  mcpAccessLevel,
  error,
  submitting,
  onKeyNameChange,
  onEnvironmentChange,
  onScopeToggle,
  onMcpAccessLevelChange,
  onBack,
  onSubmit,
  onClose,
  onResetConfirmations,
}: KeyConfigStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Key Type Summary */}
      <div className={`p-4 rounded-xl border ${selectedKeyType.borderColor} ${selectedKeyType.bgColor}`}>
        <div className="flex items-center gap-3">
          <selectedKeyType.icon className={`w-5 h-5 ${selectedKeyType.color}`} />
          <div>
            <h3 className="font-semibold text-slate-900">{selectedKeyType.title}</h3>
            <p className="text-sm text-slate-600">{selectedKeyType.description}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{selectedKeyType.warning}</p>
        </div>
      </div>

      {/* Key Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Key Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={keyName}
          onChange={(e) => onKeyNameChange(e.target.value)}
          placeholder="e.g., Production App, Development Server"
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
          autoFocus
          required
        />
      </div>

      {/* Environment Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Environment <span className="text-red-500">*</span>
        </label>
        <div className="grid md:grid-cols-3 gap-3">
          {ENVIRONMENT_OPTIONS.map((env) => (
            <button
              key={env.value}
              type="button"
              onClick={() => onEnvironmentChange(env.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                environment === env.value
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900">{env.label}</div>
              <div className="text-xs text-slate-500 mt-1">{env.description}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Key prefix: <code className="px-1 py-0.5 bg-slate-100 rounded text-emerald-700">
            {getKeyPrefix(selectedKeyType.type, environment, mcpAccessLevel)}
          </code>
        </p>
      </div>

      {/* MCP Access Level (only for MCP keys) */}
      {selectedKeyType.type === 'mcp' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Access Level <span className="text-red-500">*</span>
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            {MCP_ACCESS_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => {
                  onMcpAccessLevelChange(level.value)
                  onResetConfirmations()
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mcpAccessLevel === level.value
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`font-medium ${level.color}`}>{level.label}</div>
                <div className="text-xs text-slate-500 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scope Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Scopes <span className="text-slate-400">(Permissions)</span>
        </label>
        <div className="space-y-3">
          {Object.entries(SCOPES_BY_SERVICE).map(([service, scopes]) => (
            <div key={service} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {service === 'db' && <Database className="w-4 h-4 text-slate-600" />}
                  {service === 'storage' && <HardDrive className="w-4 h-4 text-slate-600" />}
                  {service === 'auth' && <Lock className="w-4 h-4 text-slate-600" />}
                  {service === 'realtime' && <Sparkles className="w-4 h-4 text-slate-600" />}
                  {service === 'graphql' && <Eye className="w-4 h-4 text-slate-600" />}
                  <span className="font-medium text-slate-900 capitalize">{service}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = scopes.every((s) => selectedScopes.includes(s))
                    if (allSelected) {
                      onScopeToggle
                    } else {
                      scopes.forEach((s) => {
                        if (!selectedScopes.includes(s)) {
                          onScopeToggle(s)
                        }
                      })
                    }
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800"
                >
                  {scopes.every((s) => selectedScopes.includes(s)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {scopes.map((scope) => (
                  <label
                    key={scope}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                      selectedScopes.includes(scope)
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => onScopeToggle(scope)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !keyName.trim()}
          className="px-6 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            'Create Key'
          )}
        </button>
      </div>
    </form>
  )
}

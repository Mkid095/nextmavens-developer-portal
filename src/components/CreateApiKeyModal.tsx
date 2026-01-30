'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Key,
  Shield,
  Globe,
  Cpu,
  AlertTriangle,
  Check,
  Copy,
  ChevronRight,
  Database,
  HardDrive,
  Lock,
  Eye,
  Sparkles,
} from 'lucide-react'
import { ApiKeyType, ApiKeyEnvironment, ApiKeyScope, DEFAULT_SCOPES, getKeyPrefix, SCOPES_BY_SERVICE } from '@/lib/types/api-key.types'

interface CreateApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateKey: (data: CreateKeyData) => Promise<void>
  projectId?: string
}

export interface CreateKeyData {
  name: string
  key_type: ApiKeyType
  environment: ApiKeyEnvironment
  scopes?: ApiKeyScope[]
  mcpAccessLevel?: 'ro' | 'rw' | 'admin'
}

interface KeyTypeOption {
  type: ApiKeyType
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  warning: string
  defaultScopes: ApiKeyScope[]
  useCases: string[]
}

const KEY_TYPE_OPTIONS: KeyTypeOption[] = [
  {
    type: 'public',
    title: 'Public Key',
    description: 'Safe for client-side apps. Read-only access to data.',
    icon: Globe,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    warning: 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.',
    defaultScopes: DEFAULT_SCOPES.public,
    useCases: ['Frontend web apps', 'Mobile apps', 'Public APIs', 'Browser SDKs'],
  },
  {
    type: 'secret',
    title: 'Secret Key',
    description: 'Full CRUD access. For server-side applications only.',
    icon: Key,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    warning: 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.',
    defaultScopes: DEFAULT_SCOPES.secret,
    useCases: ['Backend servers', 'API integrations', 'CLI tools', 'Serverless functions'],
  },
  {
    type: 'service_role',
    title: 'Service Role Key',
    description: 'Bypasses RLS. Full admin access for trusted services.',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    warning: 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.',
    defaultScopes: DEFAULT_SCOPES.service_role,
    useCases: ['Admin tasks', 'Database migrations', 'Trusted backend services', 'Cron jobs'],
  },
  {
    type: 'mcp',
    title: 'MCP Token',
    description: 'For AI tools and Model Context Protocol integrations.',
    icon: Cpu,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    warning: 'This token is for use with AI assistants and MCP-compatible tools. Different access levels provide varying permissions. Keep tokens secure and rotate regularly.',
    defaultScopes: DEFAULT_SCOPES.mcp_ro,
    useCases: ['AI assistants', 'Claude MCP integration', 'Automated agents', 'Tool integrations'],
  },
]

const ENVIRONMENT_OPTIONS: { value: ApiKeyEnvironment; label: string; description: string }[] = [
  { value: 'prod', label: 'Production', description: 'Live environment for production applications' },
  { value: 'staging', label: 'Staging', description: 'Pre-production testing environment' },
  { value: 'dev', label: 'Development', description: 'Development and testing environment' },
]

const MCP_ACCESS_LEVELS = [
  { value: 'ro' as const, label: 'Read Only', description: 'Can only read data', color: 'text-emerald-600' },
  { value: 'rw' as const, label: 'Read/Write', description: 'Can read and modify data', color: 'text-amber-600' },
  { value: 'admin' as const, label: 'Admin', description: 'Full access including delete', color: 'text-red-600' },
]

interface CreatedKeyDisplay {
  apiKey: {
    id: string
    name: string
    public_key: string
    key_type: string
    key_prefix: string
  }
  secretKey?: string
}

export default function CreateApiKeyModal({ isOpen, onClose, onCreateKey, projectId }: CreateApiKeyModalProps) {
  const [step, setStep] = useState<'type' | 'config' | 'success'>('type')
  const [selectedKeyType, setSelectedKeyType] = useState<KeyTypeOption | null>(null)
  const [keyName, setKeyName] = useState('')
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>('prod')
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>([])
  const [mcpAccessLevel, setMcpAccessLevel] = useState<'ro' | 'rw' | 'admin'>('ro')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdKey, setCreatedKey] = useState<CreatedKeyDisplay | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('type')
      setSelectedKeyType(null)
      setKeyName('')
      setEnvironment('prod')
      setSelectedScopes([])
      setMcpAccessLevel('ro')
      setError('')
      setCreatedKey(null)
    }
  }, [isOpen])

  // Update scopes when key type changes
  useEffect(() => {
    if (selectedKeyType) {
      if (selectedKeyType.type === 'mcp') {
        setSelectedScopes(DEFAULT_SCOPES[`mcp_${mcpAccessLevel}`] || DEFAULT_SCOPES.mcp_ro)
      } else {
        setSelectedScopes(selectedKeyType.defaultScopes)
      }
    }
  }, [selectedKeyType, mcpAccessLevel])

  const handleKeyTypeSelect = (option: KeyTypeOption) => {
    setSelectedKeyType(option)
    setStep('config')
  }

  const handleScopeToggle = (scope: ApiKeyScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKeyType || !keyName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const data: CreateKeyData = {
        name: keyName.trim(),
        key_type: selectedKeyType.type,
        environment,
        scopes: selectedScopes,
      }

      if (selectedKeyType.type === 'mcp') {
        data.mcpAccessLevel = mcpAccessLevel
      }

      await onCreateKey(data)

      // For now, we'll show a success message
      // In real implementation, the API would return the created key
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Failed to create API key')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleBack = () => {
    setStep('type')
  }

  const generateUsageExamples = () => {
    if (!createdKey) return []

    const key = createdKey.secretKey || createdKey.apiKey.public_key
    const prefix = getKeyPrefix(selectedKeyType!.type, environment, mcpAccessLevel)

    const examples = [
      {
        title: 'Environment Variable',
        code: `NEXTMAVENS_API_KEY=${key}`,
        language: 'bash',
      },
      {
        title: 'JavaScript SDK',
        code: `import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${projectId || 'your-project-id'}'
})`,
        language: 'javascript',
      },
      {
        title: 'cURL Request',
        code: `curl -X GET "https://api.nextmavens.cloud/rest/v1/users" \\
  -H "apikey: ${key}" \\
  -H "Authorization: Bearer ${key}"`,
        language: 'bash',
      },
    ]

    return examples
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Key className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Create API Key</h2>
                  <p className="text-sm text-slate-500">
                    {step === 'type' && 'Choose the type of key you need'}
                    {step === 'config' && 'Configure your key settings'}
                    {step === 'success' && 'Your key has been created'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Key Type Selection */}
              {step === 'type' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {KEY_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.type}
                          onClick={() => handleKeyTypeSelect(option)}
                          className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                            selectedKeyType?.type === option.type
                              ? `${option.borderColor} ${option.bgColor} ring-2 ring-offset-2`
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${option.bgColor}`}>
                              <Icon className={`w-5 h-5 ${option.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 mb-1">{option.title}</h3>
                              <p className="text-sm text-slate-600 mb-2">{option.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {option.useCases.slice(0, 2).map((useCase, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                                  >
                                    {useCase}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 self-center" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Configuration */}
              {step === 'config' && selectedKeyType && (
                <form onSubmit={handleCreateKey} className="space-y-6">
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
                      onChange={(e) => setKeyName(e.target.value)}
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
                          onClick={() => setEnvironment(env.value)}
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
                            onClick={() => setMcpAccessLevel(level.value)}
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
                                  setSelectedScopes((prev) => prev.filter((s) => !scopes.includes(s)))
                                } else {
                                  setSelectedScopes((prev) => [
                                    ...new Set([...prev, ...scopes]),
                                  ])
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
                                  onChange={() => handleScopeToggle(scope)}
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
                      onClick={handleBack}
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
                        <>
                          <Key className="w-4 h-4" />
                          Create Key
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">API Key Created!</h3>
                    <p className="text-slate-600">Your API key has been created successfully.</p>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Important: Save Your Key Now</h4>
                        <p className="text-sm text-red-800">
                          You will only see this key <strong>one time</strong>. Make sure to copy it and store it securely.
                          You won't be able to retrieve it again after closing this modal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Display (placeholder - would show actual key in production) */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <label className="block text-xs text-slate-400 mb-2">Your API Key</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-emerald-400 text-sm break-all">
                        {getKeyPrefix(selectedKeyType!.type, environment, mcpAccessLevel)}••••••••••••••••
                      </code>
                      <button
                        onClick={() => handleCopy('your-api-key-here', 'created-key')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition"
                      >
                        {copied === 'created-key' ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Usage Examples */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Quick Start Examples</h4>
                    <div className="space-y-4">
                      {generateUsageExamples().map((example, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                            <span className="font-medium text-slate-700 text-sm">{example.title}</span>
                            <button
                              onClick={() => handleCopy(example.code, `example-${index}`)}
                              className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                            >
                              {copied === `example-${index}` ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="bg-slate-900 p-4 overflow-x-auto">
                            <code className="text-sm text-slate-300 font-mono">{example.code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setStep('type')
                        setSelectedKeyType(null)
                        setKeyName('')
                      }}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
                    >
                      Create Another Key
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, ChevronRight } from 'lucide-react'
import { useCreateApiKeyModal } from './create-api-key/useCreateApiKeyModal'
import { KeyConfigStep, WriteWarningStep, AdminWarningStep, SuccessStep, KEY_TYPE_OPTIONS } from './create-api-key'
import type { CreateApiKeyModalProps, KeyTypeOption } from './create-api-key/types'

export default function CreateApiKeyModal({ isOpen, onClose, onCreateKey, projectId }: CreateApiKeyModalProps) {
  const {
    step,
    selectedKeyType,
    keyName,
    environment,
    selectedScopes,
    mcpAccessLevel,
    submitting,
    error,
    writeWarningConfirmed,
    adminWarningConfirmed,
    copied,
    setKeyName,
    setEnvironment,
    setSelectedScopes,
    setMcpAccessLevel,
    setWriteWarningConfirmed,
    setAdminWarningConfirmed,
    handleKeyTypeSelect,
    handleBack,
    handleScopeToggle,
    handleCreateKey,
    handleCopy,
    resetForm,
  } = useCreateApiKeyModal({ isOpen, onCreateKey })

  const getStepTitle = () => {
    switch (step) {
      case 'type':
        return 'Choose the type of key you need'
      case 'config':
        return 'Configure your key settings'
      case 'confirm-write':
        return 'Confirm write access'
      case 'confirm-admin':
        return 'Admin token confirmation'
      case 'success':
        return 'Your key has been created'
    }
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
                  <p className="text-sm text-slate-500">{getStepTitle()}</p>
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Key Type</h3>
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
                <KeyConfigStep
                  selectedKeyType={selectedKeyType}
                  keyName={keyName}
                  environment={environment}
                  selectedScopes={selectedScopes}
                  mcpAccessLevel={mcpAccessLevel}
                  error={error}
                  submitting={submitting}
                  onKeyNameChange={setKeyName}
                  onEnvironmentChange={setEnvironment}
                  onScopeToggle={handleScopeToggle}
                  onMcpAccessLevelChange={(level) => {
                    setMcpAccessLevel(level)
                    setWriteWarningConfirmed(false)
                    setAdminWarningConfirmed(false)
                  }}
                  onBack={handleBack}
                  onSubmit={handleCreateKey}
                  onClose={onClose}
                  onResetConfirmations={() => {
                    setWriteWarningConfirmed(false)
                    setAdminWarningConfirmed(false)
                  }}
                />
              )}

              {/* Step 3: Write Access Warning */}
              {step === 'confirm-write' && selectedKeyType && selectedKeyType.type === 'mcp' && (
                <WriteWarningStep
                  mcpAccessLevel={mcpAccessLevel}
                  writeWarningConfirmed={writeWarningConfirmed}
                  submitting={submitting}
                  onConfirmChange={setWriteWarningConfirmed}
                  onBack={() => setStep('config')}
                  onSubmit={handleCreateKey}
                  onClose={onClose}
                />
              )}

              {/* Step 4: Admin Warning */}
              {step === 'confirm-admin' && selectedKeyType && selectedKeyType.type === 'mcp' && (
                <AdminWarningStep
                  adminWarningConfirmed={adminWarningConfirmed}
                  submitting={submitting}
                  onConfirmChange={setAdminWarningConfirmed}
                  onBack={() => setStep('confirm-write')}
                  onSubmit={handleCreateKey}
                  onClose={onClose}
                />
              )}

              {/* Step 5: Success */}
              {step === 'success' && selectedKeyType && (
                <SuccessStep
                  selectedKeyType={selectedKeyType.type}
                  environment={environment}
                  mcpAccessLevel={mcpAccessLevel}
                  copied={copied}
                  onCopy={handleCopy}
                  onCreateAnother={resetForm}
                  onClose={onClose}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Export types for backward compatibility
export type { CreateKeyData } from './create-api-key/types'

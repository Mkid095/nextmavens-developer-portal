/**
 * Create Flag Modal Component
 * Modal for creating a new project-specific feature flag
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { FeatureFlag } from '../types'
import { AVAILABLE_FLAGS } from '../constants'

interface CreateFlagModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, enabled: boolean) => Promise<boolean>
  existingFlags: FeatureFlag[]
}

export function CreateFlagModal({
  isOpen,
  onClose,
  onCreate,
  existingFlags,
}: CreateFlagModalProps) {
  const [flagName, setFlagName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const availableFlags = AVAILABLE_FLAGS.filter(
    (name) => !existingFlags.find((f) => f.name === name)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!flagName.trim()) {
      setError('Flag name is required')
      return
    }

    setCreating(true)
    const success = await onCreate(flagName.trim(), enabled)
    setCreating(false)

    if (success) {
      setFlagName('')
      setEnabled(true)
      onClose()
    }
  }

  const handleClose = () => {
    setFlagName('')
    setEnabled(true)
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Create Project Flag</h3>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Flag Name
                </label>
                <select
                  value={flagName}
                  onChange={(e) => setFlagName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select a flag...</option>
                  {availableFlags.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Project-specific flags override global flags
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Enable this flag</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !flagName}
                  className="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Flag'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

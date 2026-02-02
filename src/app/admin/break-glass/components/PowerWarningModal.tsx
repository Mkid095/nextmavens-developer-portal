/**
 * Power Warning Modal Component
 * Modal for confirming power execution
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import type { Power, BreakGlassSession } from '../types'

interface PowerWarningModalProps {
  power: Power | null
  session: BreakGlassSession | null
  projectId: string
  onProjectIdChange: (id: string) => void
  onExecute: () => void
  onClose: () => void
}

export function PowerWarningModal({
  power,
  session,
  projectId,
  onProjectIdChange,
  onExecute,
  onClose,
}: PowerWarningModalProps) {
  if (!power) return null

  return (
    <AnimatePresence>
      {power && (
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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Execute Power</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Warning:</strong> {power.warning}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 mb-2">{power.name}</h3>
              <p className="text-sm text-slate-600 mb-4">{power.description}</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Project ID</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => onProjectIdChange(e.target.value)}
                  placeholder="Enter project UUID"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This action will be executed on the specified project
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-600">
                  <div>
                    <strong>Endpoint:</strong> <code className="font-mono">{power.endpoint}</code>
                  </div>
                  <div className="mt-1">
                    <strong>Method:</strong> <span>{power.method}</span>
                  </div>
                  <div className="mt-1">
                    <strong>Session:</strong>{' '}
                    <code className="font-mono">{session?.session_id.slice(0, 8)}...</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={onExecute}
                className="flex-1 px-4 py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Execute
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

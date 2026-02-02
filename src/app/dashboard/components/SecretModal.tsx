/**
 * Secret Key Display Modal Component
 */

import { Copy } from 'lucide-react'
import type { Project } from '../utils'

interface SecretModalProps {
  isOpen: boolean
  onClose: () => void
  secretKey: string
  projectName: string
}

export function SecretModal({ isOpen, onClose, secretKey, projectName }: SecretModalProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(secretKey)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">API Key Created</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-600 mb-4">
            Your API key <strong>{projectName}</strong> has been created successfully.
          </p>

          <div className="bg-slate-900 rounded-xl p-4">
            <label className="block text-xs text-slate-400 mb-2">Secret Key (copy this now)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-emerald-400 text-sm break-all">
                {secretKey}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
              >
                <Copy className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Store this secret key securely. You won&apos;t be able to see it again after closing this dialog.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
        >
          I&apos;ve saved my secret key
        </button>
      </motion.div>
    </div>
  )
}

import { Copy, X } from 'lucide-react'
import { motion } from 'framer-motion'

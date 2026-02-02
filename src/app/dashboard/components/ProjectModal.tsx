/**
 * Project Modal Component
 */

import { X, Loader2 } from 'lucide-react'
import type { Project } from '../utils'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitting: boolean
  error?: string
  onSubmit: (e: React.FormEvent) => Promise<void>
}

export function ProjectModal({ isOpen, onClose, onSubmitting, error, onSubmit }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    project_name: '',
    environment: 'prod' as 'prod' | 'dev' | 'staging',
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        project_name: '',
        environment: 'prod',
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Create Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
              placeholder="e.g., My Awesome App"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Environment
            </label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value as any }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
            >
              <option value="prod">Production</option>
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Production:</strong> Stable environment with standard rate limits and auto-suspend enabled.<br />
              <strong>Development:</strong> For experimentation with relaxed limits (10x), no auto-suspend, and infinite webhook retries.<br />
              <strong>Staging:</strong> Pre-production testing with moderate limits (5x) and 5 webhook retries.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={onSubmitting}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={onSubmitting}
              className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {onSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

import { AlertCircle, motion } from 'framer-motion'
import { useState, useEffect } from 'react'

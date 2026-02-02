/**
 * Organizations Page - Module - Create Organization Modal Component
 */

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { CreateOrganizationFormState } from '../types'

interface CreateOrganizationModalProps {
  show: boolean
  formState: CreateOrganizationFormState
  onOrgNameChange: (name: string) => void
  onOrgSlugChange: (slug: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function CreateOrganizationModal({
  show,
  formState,
  onOrgNameChange,
  onOrgSlugChange,
  onSubmit,
  onClose,
}: CreateOrganizationModalProps) {
  return (
    <AnimatePresence>
      {show && (
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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create Organization</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formState.orgName}
                  onChange={(e) => onOrgNameChange(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Slug (optional)
                </label>
                <input
                  type="text"
                  value={formState.orgSlug}
                  onChange={(e) => onOrgSlugChange(e.target.value)}
                  placeholder="e.g., acme-corp"
                  pattern="[a-z0-9-]+"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Leave empty to generate from name. Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>

              {formState.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{formState.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={formState.submitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formState.submitting}
                  className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formState.submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

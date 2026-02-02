/**
 * Support Request Modal - Support Form Component
 */

import { Send, Database, Activity, Check, AlertTriangle } from 'lucide-react'
import type { FormState } from '../types'

interface SupportFormProps {
  formState: FormState
  projectName: string
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  setSubject: (subject: string) => void
  setDescription: (description: string) => void
}

export function SupportForm({
  formState,
  projectName,
  onSubmit,
  onClose,
  setSubject,
  setDescription,
}: SupportFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Project Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-900">Project:</span>
          <span className="text-slate-600">{projectName}</span>
        </div>
      </div>

      {/* Context Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-blue-900 text-sm">Context That Will Be Attached</h4>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3" />
            Project information (ID, name, status)
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3" />
            Recent errors (last 10)
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3" />
            Current usage metrics
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3" />
            Recent logs snippet (last 20 lines)
          </li>
        </ul>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formState.subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
          autoFocus
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formState.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe your issue in detail. Include any relevant steps, error messages, or expected behavior."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent min-h-[150px] resize-none"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          Minimum 10 characters
        </p>
      </div>

      {/* Error Display */}
      {formState.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{formState.error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          disabled={formState.submitting}
          className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <div className="flex-1" />
        <button
          type="submit"
          disabled={formState.submitting || !formState.subject.trim() || formState.description.length < 10}
          className="px-6 py-3 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-2"
        >
          {formState.submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Request
            </>
          )}
        </button>
      </div>
    </form>
  )
}

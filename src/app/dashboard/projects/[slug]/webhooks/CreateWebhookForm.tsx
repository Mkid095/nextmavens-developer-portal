/**
 * Create Webhook Form Component
 * Form for creating new webhooks
 */

import { motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { EVENT_TYPES } from './constants'
import { getAuthToken } from './utils'

interface CreateWebhookFormProps {
  project: { id: string; name: string }
  onSubmit: (event: React.FormEvent) => Promise<void>
  onCancel: () => void
  onSubmitting: boolean
}

interface CreateWebhookFormData {
  event: string
  target_url: string
  enabled: boolean
}

export function CreateWebhookForm({
  project,
  onSubmit,
  onCancel,
  onSubmitting,
}: CreateWebhookFormProps) {
  const [formData, setFormData] = useState<CreateWebhookFormData>({
    event: '',
    target_url: '',
    enabled: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  const handleChange = (field: keyof CreateWebhookFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleToggle = () => {
    setFormData(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4">Create New Webhook</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Event Type
          </label>
          <select
            value={formData.event}
            onChange={(e) => handleChange('event', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select an event type</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target URL
          </label>
          <input
            type="url"
            value={formData.target_url}
            onChange={(e) => handleChange('target_url', e.target.value)}
            placeholder="https://your-server.com/webhooks"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            The URL where webhook events will be sent
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-slate-300">Enable Webhook</label>
            <p className="text-xs text-slate-500">
              When enabled, this webhook will receive events
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.enabled ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            {formData.enabled ? (
              <span className="h-4 w-4 translate-x-5 rounded-full bg-white transition-transform" />
            ) : (
              <span className="h-4 w-4 rounded-full bg-slate-400 transition-transform" />
            )}
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={onSubmitting || !formData.event || !formData.target_url}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {onSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Webhook
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

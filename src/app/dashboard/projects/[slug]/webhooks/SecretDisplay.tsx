/**
 * Secret Display Component
 * Displays the webhook secret after creation
 */

import { CheckCircle, X } from 'lucide-react'

interface SecretDisplayProps {
  secret: string
  onClose: () => void
}

export function SecretDisplay({ secret, onClose }: SecretDisplayProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(secret)
  }

  return (
    <div className="mb-6 rounded-lg border border-blue-900/50 bg-blue-900/20 p-6">
      <div className="flex items-start gap-4">
        <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-200 mb-2">Webhook Created Successfully</h3>
          <p className="text-sm text-blue-300 mb-4">
            Your webhook has been created. Copy the secret below and store it securely. You won&apos;t be able to see it again.
          </p>
          <div className="relative">
            <code className="block w-full rounded-lg bg-slate-950 p-3 text-sm text-blue-200 break-all">
              {secret}
            </code>
            <button
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-blue-400 hover:text-blue-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

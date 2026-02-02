/**
 * Webhook Info Section Component
 * Displays information about webhooks
 */

import { CheckCircle } from 'lucide-react'
import { WEBHOOK_INFO_ITEMS } from './constants'

interface InfoSectionProps {
  project?: { name: string }
}

export function InfoSection({ project }: InfoSectionProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-6">
      <h3 className="text-sm font-semibold text-white mb-3">About Webhooks</h3>
      <ul className="space-y-2 text-xs text-slate-400">
        {WEBHOOK_INFO_ITEMS.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className={`h-4 w-4 ${item.color} flex-shrink-0 mt-0.5`} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

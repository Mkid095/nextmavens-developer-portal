/**
 * Deletion Preview Modal - Recovery Information Component
 */

import { Calendar } from 'lucide-react'
import { formatDate } from '../utils'
import type { DeletionPreviewData } from '../types'

interface RecoveryInfoProps {
  preview: DeletionPreviewData
}

export function RecoveryInfo({ preview }: RecoveryInfoProps) {
  if (!preview.recoverable_until) {
    return null
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-emerald-900">Recoverable Until</h4>
          <p className="text-sm text-emerald-700 mt-1">
            Your project will be retained for <strong>30 days</strong> before permanent deletion.
            You can restore it anytime before:{' '}
            <strong>{formatDate(preview.recoverable_until)}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

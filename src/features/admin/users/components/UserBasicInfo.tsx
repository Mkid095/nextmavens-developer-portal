'use client'

import { Shield, Calendar, Clock } from 'lucide-react'
import type { UserDetail } from '../types'

interface UserBasicInfoProps {
  user: UserDetail
}

export function UserBasicInfo({ user }: UserBasicInfoProps) {
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-3">Basic Information</h4>
      <dl className="space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <dt className="text-xs text-slate-500">User ID</dt>
            <dd className="text-sm text-slate-900 font-mono truncate">{user.id}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <dt className="text-xs text-slate-500">Created At</dt>
            <dd className="text-sm text-slate-900">{formatTimestamp(user.created_at)}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <dt className="text-xs text-slate-500">Updated At</dt>
            <dd className="text-sm text-slate-900">{formatTimestamp(user.updated_at)}</dd>
          </div>
        </div>
      </dl>
    </div>
  )
}

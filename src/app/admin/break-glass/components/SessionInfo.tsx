/**
 * Session Info Component
 * Displays active break glass session information
 */

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import type { BreakGlassSession } from '../types'
import { formatTime } from '../utils'

interface SessionInfoProps {
  session: BreakGlassSession
  timeRemaining: number
}

export function SessionInfo({ session, timeRemaining }: SessionInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-emerald-50 border border-emerald-200 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-700" />
          <h2 className="font-semibold text-emerald-900">Break Glass Session Active</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-emerald-700">{formatTime(timeRemaining)}</div>
          <div className="text-xs text-emerald-600">until expiration</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-emerald-700">Session ID:</span>
          <code className="ml-2 text-emerald-900">{session.session_id.slice(0, 8)}...</code>
        </div>
        <div>
          <span className="text-emerald-700">Admin ID:</span>
          <code className="ml-2 text-emerald-900">{session.admin_id.slice(0, 8)}...</code>
        </div>
        <div>
          <span className="text-emerald-700">Expires:</span>
          <span className="ml-2 text-emerald-900">
            {new Date(session.expires_at).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-emerald-700">Created:</span>
          <span className="ml-2 text-emerald-900">
            {new Date(session.created_at).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

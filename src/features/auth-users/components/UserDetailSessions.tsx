'use client'

import { motion } from 'framer-motion'
import { Loader2, Monitor, MapPin, Clock, Shield, Ban, RefreshCw } from 'lucide-react'
import type { EndUserSession } from '@/lib/types/auth-user.types'

interface UserDetailSessionsProps {
  sessions?: EndUserSession[]
  loading: boolean
  error: string | null
  revokingSessionId: string | null
  onRefresh: () => void
  onRevokeSession: (sessionId: string) => void
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

interface SessionCardProps {
  session: EndUserSession
  isRevoking: boolean
  onRevoke: () => void
}

function SessionCard({ session, isRevoking, onRevoke }: SessionCardProps) {
  return (
    <div
      className={`p-4 border rounded-lg ${
        session.is_revoked
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-slate-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-slate-900">
                {session.device_name || 'Unknown Device'}
              </h3>
              {session.is_revoked && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  Revoked
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              {session.device_type && (
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>{session.device_type}</span>
                </div>
              )}

              {session.browser && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-500">Browser:</span>
                  <span>{session.browser}</span>
                </div>
              )}

              {session.ip_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{session.ip_address}</span>
                  {session.location && (
                    <span className="text-slate-400">({session.location})</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Created {formatDateTime(session.created_at)}</span>
                <span className="text-slate-400">•</span>
                <span>{getRelativeTime(session.created_at)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Last activity {formatDateTime(session.last_activity_at)}</span>
                <span className="text-slate-400">•</span>
                <span>{getRelativeTime(session.last_activity_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {!session.is_revoked && (
          <button
            onClick={onRevoke}
            disabled={isRevoking}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRevoking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                Revoke
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export function UserDetailSessions({
  sessions,
  loading,
  error,
  revokingSessionId,
  onRefresh,
  onRevokeSession,
}: UserDetailSessionsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Active Sessions</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading && !sessions ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            <span className="text-slate-600">Loading sessions...</span>
          </div>
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="p-12 text-center">
          <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No active sessions</p>
          <p className="text-sm text-slate-400">
            This user has no active sessions
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {sessions.map((session) => (
            <SessionCard
              key={session.session_id}
              session={session}
              isRevoking={revokingSessionId === session.session_id}
              onRevoke={() => onRevokeSession(session.session_id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

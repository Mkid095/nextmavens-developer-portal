'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mail, Calendar, Shield, ArrowLeft, RefreshCw } from 'lucide-react'
import type { EndUserDetailResponse, EndUserSession, EndUserAuthHistory } from '@/lib/types/auth-user.types'
import { UserDetailHeader } from '@/features/auth-users/components/UserDetailHeader'
import { UserDetailInfo } from '@/features/auth-users/components/UserDetailInfo'
import { UserDetailSessions } from '@/features/auth-users/components/UserDetailSessions'
import { UserAuthHistory } from '@/features/auth-users/components/UserAuthHistory'

interface UserDetailProps {
  userId: string
  onBack: () => void
  onUserUpdated?: () => void
}

interface UserDetailData extends EndUserDetailResponse {
  sessions?: EndUserSession[]
  authHistory?: EndUserAuthHistory[]
}

/**
 * Helper function to make authenticated API requests to the backend
 */
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response
}

export function UserDetail({ userId, onBack, onUserUpdated }: UserDetailProps) {
  const [user, setUser] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [authHistoryLoading, setAuthHistoryLoading] = useState(false)
  const [authHistoryError, setAuthHistoryError] = useState<string | null>(null)
  const [authHistoryOffset, setAuthHistoryOffset] = useState(0)
  const [authHistoryTotal, setAuthHistoryTotal] = useState(0)
  const authHistoryLimit = 20

  const fetchUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiRequest(`/api/auth/users/${userId}`)
      const userData = await response.json()
      setUser(userData)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    setSessionsLoading(true)
    setSessionError(null)

    try {
      const response = await apiRequest(`/api/auth/users/${userId}/sessions`)
      const data = await response.json()
      setUser((prev) => (prev ? { ...prev, sessions: data.sessions } : null))
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setSessionError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setSessionsLoading(false)
    }
  }

  const fetchAuthHistory = async () => {
    setAuthHistoryLoading(true)
    setAuthHistoryError(null)

    try {
      const params = new URLSearchParams({
        limit: String(authHistoryLimit),
        offset: String(authHistoryOffset),
      })
      const response = await apiRequest(`/api/auth/users/${userId}/auth-history?${params}`)
      const data = await response.json()
      setUser((prev) => (prev ? { ...prev, authHistory: data.history } : null))
      setAuthHistoryTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch auth history:', err)
      setAuthHistoryError(err instanceof Error ? err.message : 'Failed to load authentication history')
    } finally {
      setAuthHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    fetchSessions()
    fetchAuthHistory()
  }, [userId])

  useEffect(() => {
    fetchAuthHistory()
  }, [authHistoryOffset])

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    setSessionError(null)

    try {
      await apiRequest(`/api/auth/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      setUser((prev) => {
        if (!prev?.sessions) return prev
        return {
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.session_id === sessionId
              ? { ...session, is_revoked: true }
              : session
          ),
        }
      })
    } catch (err) {
      console.error('Failed to revoke session:', err)
      setSessionError(err instanceof Error ? err.message : 'Failed to revoke session')
    } finally {
      setRevokingSessionId(null)
    }
  }

  const handleDisableUser = async (targetUserId: string) => {
    setIsUpdatingStatus(true)
    setError(null)

    try {
      const response = await apiRequest(`/api/auth/users/${targetUserId}/disable`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const data = await response.json()

      setUser((prev) =>
        prev ? { ...prev, status: data.status, updated_at: data.updated_at } : null
      )

      if (onUserUpdated) {
        onUserUpdated()
      }
    } catch (err) {
      console.error('Failed to disable user:', err)
      setError(err instanceof Error ? err.message : 'Failed to disable user')
      throw err
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEnableUser = async (targetUserId: string) => {
    setIsUpdatingStatus(true)
    setError(null)

    try {
      const response = await apiRequest(`/api/auth/users/${targetUserId}/enable`, {
        method: 'POST',
      })
      const data = await response.json()

      setUser((prev) =>
        prev ? { ...prev, status: data.status, updated_at: data.updated_at } : null
      )

      if (onUserUpdated) {
        onUserUpdated()
      }
    } catch (err) {
      console.error('Failed to enable user:', err)
      setError(err instanceof Error ? err.message : 'Failed to enable user')
      throw err
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleMetadataUpdated = (metadata: Record<string, unknown>) => {
    setUser((prev) =>
      prev ? { ...prev, user_metadata: metadata, updated_at: new Date().toISOString() } : null
    )

    if (onUserUpdated) {
      onUserUpdated()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-slate-600">Loading user details...</span>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600 mb-2">Error loading user</p>
        <p className="text-sm text-slate-500">{error || 'User not found'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <UserDetailHeader
        user={user}
        onBack={onBack}
        onDisable={handleDisableUser}
        onEnable={handleEnableUser}
        isLoading={isUpdatingStatus}
      />
      <UserDetailInfo user={user} onMetadataUpdated={handleMetadataUpdated} />
      <UserDetailSessions
        sessions={user.sessions}
        loading={sessionsLoading}
        error={sessionError}
        revokingSessionId={revokingSessionId}
        onRefresh={fetchSessions}
        onRevokeSession={handleRevokeSession}
      />
      <UserAuthHistory
        userId={userId}
        history={user.authHistory}
        loading={authHistoryLoading}
        error={authHistoryError}
        total={authHistoryTotal}
        limit={authHistoryLimit}
        offset={authHistoryOffset}
        onRefresh={fetchAuthHistory}
        onPageChange={(offset) => setAuthHistoryOffset(offset)}
      />
    </div>
  )
}

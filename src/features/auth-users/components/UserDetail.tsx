'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mail, Calendar, Shield, ArrowLeft, RefreshCw } from 'lucide-react'
import type { EndUserDetailResponse, EndUserSession } from '@/lib/types/auth-user.types'
import { authServiceClient } from '@/lib/api/auth-service-client'
import { UserDetailHeader } from '@/features/auth-users/components/UserDetailHeader'
import { UserDetailInfo } from '@/features/auth-users/components/UserDetailInfo'
import { UserDetailSessions } from '@/features/auth-users/components/UserDetailSessions'

interface UserDetailProps {
  userId: string
  onBack: () => void
  onUserUpdated?: () => void
}

interface UserDetailData extends EndUserDetailResponse {
  sessions?: EndUserSession[]
}

export function UserDetail({ userId, onBack, onUserUpdated }: UserDetailProps) {
  const [user, setUser] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const fetchUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const userData = await authServiceClient.getEndUser(userId)
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
      const response = await authServiceClient.getEndUserSessions(userId)
      setUser((prev) => (prev ? { ...prev, sessions: response.sessions } : null))
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setSessionError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    fetchSessions()
  }, [userId])

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    setSessionError(null)

    try {
      await authServiceClient.revokeEndUserSession({ userId, sessionId })

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
      const response = await authServiceClient.disableEndUser({
        userId: targetUserId,
      })

      setUser((prev) =>
        prev ? { ...prev, status: response.status, updated_at: response.updated_at } : null
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
      const response = await authServiceClient.enableEndUser({
        userId: targetUserId,
      })

      setUser((prev) =>
        prev ? { ...prev, status: response.status, updated_at: response.updated_at } : null
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
      <UserDetailInfo user={user} />
      <UserDetailSessions
        sessions={user.sessions}
        loading={sessionsLoading}
        error={sessionError}
        revokingSessionId={revokingSessionId}
        onRefresh={fetchSessions}
        onRevokeSession={handleRevokeSession}
      />
    </div>
  )
}

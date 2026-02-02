/**
 * Break Glass Session Hook
 * Manages break glass session state and expiration countdown
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BreakGlassSession } from '../types'
import { BREAK_GLASS_STORAGE_KEY, SESSION_CHECK_INTERVAL } from '../constants'
import { formatTime } from '../utils'

export function useBreakGlassSession() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [session, setSession] = useState<BreakGlassSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  // Initialize session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    const storedSession = localStorage.getItem(BREAK_GLASS_STORAGE_KEY)
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession)
        const expiresAt = new Date(sessionData.expires_at)
        if (expiresAt > new Date()) {
          setSession(sessionData)
          setAuthenticated(true)
          setTimeRemaining(sessionData.expires_in_seconds)
        } else {
          localStorage.removeItem(BREAK_GLASS_STORAGE_KEY)
        }
      } catch (e) {
        localStorage.removeItem(BREAK_GLASS_STORAGE_KEY)
      }
    }

    setLoading(false)
  }, [router])

  // Countdown timer
  useEffect(() => {
    if (!session || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSessionExpired()
          return 0
        }
        return prev - 1
      })
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [session, timeRemaining])

  const handleSessionExpired = () => {
    setSession(null)
    setAuthenticated(false)
    setTimeRemaining(0)
    localStorage.removeItem(BREAK_GLASS_STORAGE_KEY)
  }

  const activateSession = (sessionData: BreakGlassSession) => {
    setSession(sessionData)
    setAuthenticated(true)
    setTimeRemaining(sessionData.expires_in_seconds)
    localStorage.setItem(BREAK_GLASS_STORAGE_KEY, JSON.stringify(sessionData))
  }

  const clearSession = () => {
    setSession(null)
    setAuthenticated(false)
    setTimeRemaining(0)
    localStorage.removeItem(BREAK_GLASS_STORAGE_KEY)
  }

  return {
    loading,
    authenticated,
    session,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    activateSession,
    clearSession,
    handleSessionExpired,
  }
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'

interface FeatureFlag {
  name: string
  enabled: boolean
  scope: 'global' | 'project' | 'org'
  metadata: Record<string, unknown>
}

interface FlagsResponse {
  success: boolean
  flags?: FeatureFlag[]
  error?: string
  code?: string
  details?: string
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function FeatureFlagsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [fetching, setFetching] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchFlags()
  }, [router])

  const fetchFlags = async () => {
    setFetching(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/feature-flags', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
          return
        }
        if (res.status === 403) {
          setError('You do not have permission to access feature flags. Admin or operator role required.')
          return
        }
        throw new Error(data.error || data.details || 'Failed to fetch feature flags')
      }

      setFlags(data.flags || [])
    } catch (err: any) {
      console.error('Failed to fetch feature flags:', err)
      setError(err.message || 'Failed to fetch feature flags')
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  const handleToggleFlag = async (flag: FeatureFlag) => {
    setUpdating(flag.name)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/admin/feature-flags/${flag.name}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !flag.enabled,
          scope: flag.scope,
        }),
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to update feature flag')
      }

      // Optimistically update the flag
      setFlags((prev) =>
        prev.map((f) =>
          f.name === flag.name ? { ...f, enabled: !flag.enabled } : f
        )
      )

      addToast(
        'success',
        `${flag.name} ${!flag.enabled ? 'enabled' : 'disabled'} successfully`
      )
    } catch (err: any) {
      console.error('Failed to update feature flag:', err)
      setError(err.message || 'Failed to update feature flag')
      addToast('error', err.message || 'Failed to update feature flag')
    } finally {
      setUpdating(null)
    }
  }

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'project':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'org':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">
              Feature Flags
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchFlags}
              disabled={fetching}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-emerald-700" />
              <h1 className="text-3xl font-semibold text-slate-900">Feature Flags</h1>
            </div>
            <p className="text-slate-600">
              Manage platform feature flags. Toggle flags to enable or disable features globally.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Feature Flags List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {flags.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No feature flags found</p>
                <p className="text-sm text-slate-500 mt-1">
                  Feature flags will appear here once created.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {flags.map((flag) => {
                  const isUpdating = updating === flag.name
                  return (
                    <motion.div
                      key={flag.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">{flag.name}</h3>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getScopeBadgeColor(
                                flag.scope
                              )}`}
                            >
                              {flag.scope}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                                flag.enabled
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              {flag.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            {flag.enabled
                              ? 'This feature is currently active'
                              : 'This feature is currently disabled'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleFlag(flag)}
                          disabled={isUpdating}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            flag.enabled
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : flag.enabled ? (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              Disabled
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <strong>Feature Flag Cache:</strong> Changes to feature flags are cached for 60 seconds.
                If you don't see changes take effect immediately, wait for the cache to expire or
                refresh the page.
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

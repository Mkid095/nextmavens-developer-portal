'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle,
  Clock,
  Lock,
  UserX,
  Trash2,
  KeyRound,
  Eye,
  AlertCircle,
} from 'lucide-react'

interface BreakGlassSession {
  success: boolean
  session_token: string
  session_id: string
  expires_at: string
  expires_in_seconds: number
  admin_id: string
  created_at: string
}

interface BreakGlassError {
  success: false
  error: string
  code: string
  details?: string
}

interface Power {
  id: string
  name: string
  description: string
  warning: string
  icon: React.ElementType
  endpoint: string
  method: 'POST' | 'DELETE' | 'GET'
  color: string
}

const POWERS: Power[] = [
  {
    id: 'unlock',
    name: 'Unlock Suspended Project',
    description: 'Unlock a suspended project regardless of the suspension reason',
    warning: 'This will bypass all suspension checks and set the project to ACTIVE status. Only use for false positive suspensions.',
    icon: Lock,
    endpoint: '/api/admin/projects/{id}/unlock',
    method: 'POST',
    color: 'amber',
  },
  {
    id: 'override',
    name: 'Override Suspension',
    description: 'Override auto-suspension and optionally increase hard caps',
    warning: 'This will clear suspension flags and may increase quota limits. Use with extreme caution.',
    icon: CheckCircle,
    endpoint: '/api/admin/projects/{id}/override-suspension',
    method: 'POST',
    color: 'blue',
  },
  {
    id: 'access',
    name: 'Access Any Project',
    description: 'View full details of any project bypassing ownership checks',
    warning: 'This allows read-only access to any project on the platform. All access is logged.',
    icon: Eye,
    endpoint: '/api/admin/projects/{id}',
    method: 'GET',
    color: 'purple',
  },
  {
    id: 'force-delete',
    name: 'Force Delete Project',
    description: 'Immediately delete a project with no grace period',
    warning: 'This will permanently delete the project and all associated resources. This action cannot be undone.',
    icon: Trash2,
    endpoint: '/api/admin/projects/{id}/force',
    method: 'DELETE',
    color: 'red',
  },
  {
    id: 'regenerate-keys',
    name: 'Regenerate System Keys',
    description: 'Invalidate all keys and generate new service_role keys',
    warning: 'This will invalidate ALL existing API keys for the project. Applications using old keys will immediately lose access.',
    icon: KeyRound,
    endpoint: '/api/admin/projects/{id}/regenerate-keys',
    method: 'POST',
    color: 'orange',
  },
]

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function BreakGlassPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [session, setSession] = useState<BreakGlassSession | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPowerWarning, setShowPowerWarning] = useState<Power | null>(null)
  const [projectId, setProjectId] = useState('')

  // Auth form states
  const [totpCode, setTotpCode] = useState('')
  const [reason, setReason] = useState('')
  const [accessMethod, setAccessMethod] = useState<'hardware_key' | 'otp' | 'emergency_code'>('otp')
  const [authenticating, setAuthenticating] = useState(false)
  const [authError, setAuthError] = useState('')

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([])

  // Expiration countdown
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    // Check for existing break glass session
    const storedSession = localStorage.getItem('breakGlassSession')
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession)
        const expiresAt = new Date(sessionData.expires_at)
        if (expiresAt > new Date()) {
          setSession(sessionData)
          setAuthenticated(true)
          setTimeRemaining(sessionData.expires_in_seconds)
        } else {
          // Session expired, clear it
          localStorage.removeItem('breakGlassSession')
        }
      } catch (e) {
        localStorage.removeItem('breakGlassSession')
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
          // Session expired
          handleSessionExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [session])

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSessionExpired = () => {
    setSession(null)
    setAuthenticated(false)
    setTimeRemaining(0)
    localStorage.removeItem('breakGlassSession')
    addToast('error', 'Break glass session has expired')
  }

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthenticating(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/break-glass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: totpCode,
          reason: reason.trim(),
          access_method: accessMethod,
        }),
      })

      const data: BreakGlassSession | BreakGlassError = await res.json()

      if (!res.ok || !data.success) {
        const error = data as BreakGlassError
        throw new Error(error.details || error.error || 'Authentication failed')
      }

      const sessionData = data as BreakGlassSession
      setSession(sessionData)
      setAuthenticated(true)
      setTimeRemaining(sessionData.expires_in_seconds)
      localStorage.setItem('breakGlassSession', JSON.stringify(sessionData))
      setShowAuthModal(false)
      setTotpCode('')
      setReason('')
      addToast('success', 'Break glass session activated')
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed')
      addToast('error', err.message || 'Authentication failed')
    } finally {
      setAuthenticating(false)
    }
  }

  const handlePowerClick = (power: Power) => {
    setProjectId('')
    setShowPowerWarning(power)
  }

  const handleExecutePower = async () => {
    if (!showPowerWarning || !session) return

    if (!projectId.trim()) {
      addToast('error', 'Please enter a project ID')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const endpoint = showPowerWarning.endpoint.replace('{id}', projectId.trim())

      const res = await fetch(endpoint, {
        method: showPowerWarning.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Break-Glass-Token': session.session_token,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.details || 'Failed to execute power')
      }

      addToast('success', `${showPowerWarning.name} executed successfully`)
      setShowPowerWarning(null)
      setProjectId('')
    } catch (err: any) {
      addToast('error', err.message || 'Failed to execute power')
    }
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
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">
              Break Glass Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            {authenticated && session && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-medium text-amber-800">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Exit
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                  Emergency Access Console
                </h1>
                <p className="text-slate-600">
                  This interface provides emergency administrative powers for critical situations.
                  All actions are logged with before/after states and linked to your admin session.
                </p>
                {!authenticated && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Initiate Break Glass
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Session Active Info */}
          {authenticated && session && (
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
                  <div className="text-2xl font-mono font-bold text-emerald-700">
                    {formatTime(timeRemaining)}
                  </div>
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
          )}

          {/* Available Powers */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {authenticated ? 'Available Powers' : 'Available Powers (Authentication Required)'}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {POWERS.map((power) => {
                const Icon = power.icon
                const isDisabled = !authenticated

                return (
                  <motion.button
                    key={power.id}
                    whileHover={isDisabled ? {} : { scale: 1.02 }}
                    whileTap={isDisabled ? {} : { scale: 0.98 }}
                    onClick={() => !isDisabled && handlePowerClick(power)}
                    disabled={isDisabled}
                    className={`p-6 rounded-xl border-2 text-left transition ${
                      isDisabled
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : `border-${power.color}-200 bg-white hover:border-${power.color}-300 hover:shadow-md cursor-pointer`
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 bg-${power.color}-100 rounded-lg`}>
                        <Icon className={`w-5 h-5 text-${power.color}-700`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{power.name}</h3>
                        <p className="text-sm text-slate-600">{power.description}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-200 rounded font-mono">
                            {power.method}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono">{power.endpoint}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Audit Notice */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <strong>Full Audit Trail:</strong> All break glass actions are logged with before/after
                states to both admin_actions and audit_logs tables. Session ID is recorded for complete
                traceability.
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowAuthModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Break Glass Authentication</h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Warning:</strong> Initiating break glass creates a time-limited admin session
                    (1 hour). All actions performed during this session are logged with full audit trail.
                  </div>
                </div>
              </div>

              <form onSubmit={handleAuthenticate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Access Method
                  </label>
                  <select
                    value={accessMethod}
                    onChange={(e) =>
                      setAccessMethod(e.target.value as 'hardware_key' | 'otp' | 'emergency_code')
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
                  >
                    <option value="otp">TOTP Code (Authenticator App)</option>
                    <option value="hardware_key">Hardware Key (YubiKey)</option>
                    <option value="emergency_code">Emergency Code</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono text-center text-lg tracking-widest"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Emergency Access
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you need break glass access (min 10 characters)"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent resize-none"
                    rows={3}
                    minLength={10}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 mt-1">{reason.length}/500 characters</p>
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{authError}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    disabled={authenticating}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={authenticating || totpCode.length !== 6 || reason.length < 10}
                    className="flex-1 px-4 py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Activate Session
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Power Execution Warning Modal */}
      <AnimatePresence>
        {showPowerWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowPowerWarning(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Execute Power</h2>
                <button
                  onClick={() => setShowPowerWarning(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Warning:</strong> {showPowerWarning.warning}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 mb-2">{showPowerWarning.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{showPowerWarning.description}</p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="Enter project UUID"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This action will be executed on the specified project
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-600">
                    <div>
                      <strong>Endpoint:</strong>{' '}
                      <code className="font-mono">{showPowerWarning.endpoint}</code>
                    </div>
                    <div className="mt-1">
                      <strong>Method:</strong> <span>{showPowerWarning.method}</span>
                    </div>
                    <div className="mt-1">
                      <strong>Session:</strong>{' '}
                      <code className="font-mono">{session?.session_id.slice(0, 8)}...</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPowerWarning(null)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecutePower}
                  className="flex-1 px-4 py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Execute
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

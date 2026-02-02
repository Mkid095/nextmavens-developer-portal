'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Shield, Loader2 } from 'lucide-react'
import { useBreakGlassSession } from './hooks/useBreakGlassSession'
import { useToasts } from './hooks/useToasts'
import { useBreakGlassAuth } from './hooks/useBreakGlassAuth'
import { useBreakGlassPowers } from './hooks/useBreakGlassPowers'
import {
  ToastNotifications,
  Navigation,
  SessionInfo,
  PowersGrid,
  AuthModal,
  PowerWarningModal,
} from './components'

export default function BreakGlassPage() {
  // Session management
  const { loading, authenticated, session, timeRemaining, formattedTime, activateSession, handleSessionExpired } =
    useBreakGlassSession()

  // Toast notifications
  const { toasts, addToast } = useToasts()

  // Authentication
  const auth = useBreakGlassAuth({
    onSuccess: (sessionData) => {
      activateSession(sessionData)
      addToast('success', 'Break glass session activated')
    },
    onError: (message) => addToast('error', message),
  })

  // Power execution
  const powers = useBreakGlassPowers({
    session,
    onExecuteSuccess: (message) => addToast('success', message),
    onExecuteError: (message) => addToast('error', message),
  })

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

      <ToastNotifications toasts={toasts} />
      <Navigation authenticated={authenticated} formattedTime={formattedTime} />

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
                    onClick={auth.openModal}
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
            <SessionInfo session={session} timeRemaining={timeRemaining} />
          )}

          {/* Available Powers */}
          <PowersGrid authenticated={authenticated} onPowerClick={powers.handlePowerClick} />

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

      <AuthModal
        isOpen={auth.showAuthModal}
        totpCode={auth.totpCode}
        reason={auth.reason}
        accessMethod={auth.accessMethod}
        authenticating={auth.authenticating}
        authError={auth.authError}
        onTotpCodeChange={auth.setTotpCode}
        onReasonChange={auth.setReason}
        onAccessMethodChange={auth.setAccessMethod}
        onSubmit={auth.handleAuthenticate}
        onClose={auth.closeModal}
      />

      <PowerWarningModal
        power={powers.showPowerWarning}
        session={session}
        projectId={powers.projectId}
        onProjectIdChange={powers.setProjectId}
        onExecute={powers.handleExecutePower}
        onClose={powers.closePowerWarning}
      />
    </div>
  )
}

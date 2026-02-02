/**
 * Feature Flags Page - Main Component
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, LogOut } from 'lucide-react'
import { useFeatureFlags, useToasts } from './hooks'
import { LoadingState, ToastNotifications, Navigation, EmptyState, ErrorState, FeatureFlagItem } from './components'
import type { FeatureFlag, FlagsResponse } from './types'

export { type FeatureFlag, type FlagsResponse }

export default function FeatureFlagsPage() {
  const router = useRouter()
  const { loading, flags, fetching, error, fetchFlags, setFlags, setError } = useFeatureFlags()
  const { toasts, addToast } = useToasts()
  const [updating, setUpdating] = useState<string | null>(null)

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

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} />

      {/* Navigation */}
      <Navigation onRefresh={fetchFlags} onLogout={handleLogout} fetching={fetching} />

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
          {error && <ErrorState error={error} />}

          {/* Feature Flags List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {flags.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-slate-200">
                {flags.map((flag) => (
                  <FeatureFlagItem
                    key={flag.name}
                    flag={flag}
                    isUpdating={updating === flag.name}
                    onToggle={handleToggleFlag}
                  />
                ))}
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

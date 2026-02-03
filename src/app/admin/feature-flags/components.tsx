/**
 * Feature Flags Page - Components
 */

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Shield, RefreshCw, LogOut, ToggleRight, ToggleLeft } from 'lucide-react'
import type { FeatureFlag, Toast } from './types'
import { getScopeBadgeColor } from './utils'

interface LoadingStateProps {
  fetching?: boolean
}

export function LoadingState({ fetching = false }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600">{fetching ? 'Refreshing...' : 'Loading...'}</span>
      </div>
    </div>
  )
}

interface ToastNotificationsProps {
  toasts: Toast[]
}

export function ToastNotifications({ toasts }: ToastNotificationsProps) {
  return (
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
  )
}

interface NavigationProps {
  onRefresh: () => void
  onLogout: () => void
  fetching: boolean
}

export function Navigation({ onRefresh, onLogout, fetching }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">
            Feature Flags
          </span>
        </a>

        <div className="flex items-center gap-4">
          <button
            onClick={onRefresh}
            disabled={fetching}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

interface EmptyStateProps {}

export function EmptyState({}: EmptyStateProps) {
  return (
    <div className="p-8 text-center">
      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-600">No feature flags found</p>
      <p className="text-sm text-slate-500 mt-1">
        Feature flags will appear here once created.
      </p>
    </div>
  )
}

interface ErrorStateProps {
  error: string
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-800 font-medium">Error</p>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    </div>
  )
}

interface FeatureFlagItemProps {
  flag: FeatureFlag
  isUpdating: boolean
  onToggle: (flag: FeatureFlag) => void
}

export function FeatureFlagItem({ flag, isUpdating, onToggle }: FeatureFlagItemProps) {
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
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getScopeBadgeColor(flag.scope)}`}
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
          onClick={() => onToggle(flag)}
          disabled={isUpdating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            flag.enabled
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
}

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Info } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

/**
 * Quota warning for a specific service
 */
interface ServiceWarning {
  service: string
  level: 'warning_80' | 'warning_90'
  usagePercentage: number
  currentUsage: number
  monthlyLimit: number
  resetAt: string
}

/**
 * Quota warnings for a project
 */
interface QuotaWarningsData {
  projectId: string
  projectName: string
  warnings: ServiceWarning[]
}

/**
 * Props for QuotaWarningBanner component
 */
interface QuotaWarningBannerProps {
  projectId: string
}

/**
 * Format service name for display
 */
function formatServiceName(service: string): string {
  const serviceNames: Record<string, string> = {
    db_queries: 'Database Queries',
    storage_mb: 'Storage',
    realtime_connections: 'Realtime Connections',
    function_invocations: 'Function Invocations',
    auth_users: 'Auth Users',
  }
  return serviceNames[service] || service
}

/**
 * Format usage number with appropriate unit
 */
function formatUsage(service: string, usage: number): string {
  if (service === 'storage_mb') {
    return `${usage.toLocaleString()} MB`
  }
  return usage.toLocaleString()
}

/**
 * Get banner color based on warning level
 */
function getBannerColor(level: 'warning_80' | 'warning_90'): string {
  return level === 'warning_90'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800'
}

/**
 * QuotaWarningBanner Component
 *
 * Displays quota warnings for projects approaching their limits.
 * Shows warnings at 80% (amber) and 90% (red) of quota usage.
 *
 * US-005: Warning shown in dashboard
 */
export default function QuotaWarningBanner({ projectId }: QuotaWarningBannerProps) {
  const [warnings, setWarnings] = useState<QuotaWarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/quota-warnings`)
        if (res.ok) {
          const data = await res.json()
          if (data.data && data.data.warnings.length > 0) {
            setWarnings(data.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch quota warnings:', err)
        setError('Failed to load quota warnings')
      } finally {
        setLoading(false)
      }
    }

    fetchWarnings()
  }, [projectId])

  // Dismiss all warnings
  const handleDismiss = () => {
    setDismissed(true)
  }

  // Toggle collapse
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  // Don't render if loading, no warnings, or dismissed
  if (loading || dismissed || !warnings || warnings.warnings.length === 0) {
    return null
  }

  // Separate warnings by severity
  const criticalWarnings = warnings.warnings.filter((w) => w.level === 'warning_90')
  const standardWarnings = warnings.warnings.filter((w) => w.level === 'warning_80')

  // Determine primary banner color (use highest severity)
  const primaryLevel = criticalWarnings.length > 0 ? 'warning_90' : 'warning_80'
  const bannerColors = getBannerColor(primaryLevel)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border rounded-lg ${bannerColors} mb-6`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {criticalWarnings.length > 0 ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {criticalWarnings.length > 0
                    ? 'Critical: Approaching quota limits'
                    : 'Quota usage warning'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleCollapse}
                    className="text-xs opacity-70 hover:opacity-100 transition"
                  >
                    {collapsed ? 'Show Details' : 'Hide'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="opacity-70 hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm mt-1 opacity-90">
                {criticalWarnings.length > 0
                  ? `Your project has exceeded 90% of quota for ${criticalWarnings.length} service${criticalWarnings.length > 1 ? 's' : ''}. Exceeding quota may result in temporary suspension.`
                  : `Your project is approaching quota limits. Consider optimizing usage or upgrading your plan.`}
              </p>

              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {warnings.warnings.map((warning, index) => {
                    const isCritical = warning.level === 'warning_90'
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-md ${
                          isCritical
                            ? 'bg-red-100/50 border border-red-300'
                            : 'bg-white/30 border border-white/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {formatServiceName(warning.service)}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              isCritical
                                ? 'bg-red-200 text-red-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {warning.usagePercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs opacity-80 space-y-1">
                          <div>
                            Usage: {formatUsage(warning.service, warning.currentUsage)} of{' '}
                            {formatUsage(warning.service, warning.monthlyLimit)}
                          </div>
                          <div>
                            Resets on: {new Date(warning.resetAt).toLocaleDateString()}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-2 bg-black/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(warning.usagePercentage, 100)}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${
                              isCritical ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

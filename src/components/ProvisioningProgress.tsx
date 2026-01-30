'use client'

/**
 * Provisioning Progress UI Component
 *
 * Shows provisioning progress with step status, auto-refresh, and retry functionality.
 *
 * Story: US-007 - Create Provisioning Progress UI
 * PRD: Provisioning State Machine
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function for className merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Provisioning step status from API
 */
export interface ProvisioningStepResponse {
  step_name: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  error_details: Record<string, unknown> | null
  retry_count: number
  created_at: string
}

/**
 * Provisioning progress response from API
 */
export interface ProvisioningProgressResponse {
  project_id: string
  project_name: string
  progress: number
  steps: ProvisioningStepResponse[]
}

/**
 * Human-readable step names mapping
 */
const STEP_LABELS: Record<string, string> = {
  create_tenant_database: 'Create Tenant Database',
  create_tenant_schema: 'Create Tenant Schema',
  register_auth_service: 'Register Auth Service',
  register_realtime_service: 'Register Realtime Service',
  register_storage_service: 'Register Storage Service',
  generate_api_keys: 'Generate API Keys',
  verify_services: 'Verify Services',
}

/**
 * Get human-readable label for step name
 */
function getStepLabel(stepName: string): string {
  return STEP_LABELS[stepName] || stepName
}

interface ProvisioningProgressProps {
  projectId: string
  projectName: string
  onComplete?: () => void
  onFailed?: () => void
  className?: string
}

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: ProvisioningStepResponse['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case 'running':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'skipped':
      return <Circle className="w-5 h-5 text-gray-400" />
    default:
      return <Circle className="w-5 h-5 text-gray-300" />
  }
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: ProvisioningStepResponse['status'] }) {
  const badges = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    running: 'bg-blue-100 text-blue-700 border-blue-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    skipped: 'bg-gray-100 text-gray-600 border-gray-200',
    pending: 'bg-gray-50 text-gray-500 border-gray-200',
  }

  const labels = {
    success: 'Completed',
    running: 'Running',
    failed: 'Failed',
    skipped: 'Skipped',
    pending: 'Pending',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
        badges[status]
      )}
    >
      {labels[status]}
    </span>
  )
}

/**
 * Provisioning Progress Component
 */
export function ProvisioningProgress({
  projectId,
  projectName,
  onComplete,
  onFailed,
  className,
}: ProvisioningProgressProps) {
  const [progress, setProgress] = useState<ProvisioningProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryingStep, setRetryingStep] = useState<string | null>(null)
  const [expandedErrorStep, setExpandedErrorStep] = useState<string | null>(null)
  const [prevProgress, setPrevProgress] = useState<number>(0)

  // Fetch provisioning progress
  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/provisioning`)
      if (!response.ok) {
        if (response.status === 404) {
          // No provisioning steps found yet
          setProgress(null)
          setLoading(false)
          return
        }
        throw new Error('Failed to fetch provisioning progress')
      }
      const data = await response.json()
      setProgress(data)
      setPrevProgress(progress?.progress ?? 0)

      // Check if provisioning is complete
      const allComplete = data.steps.every(
        (step: ProvisioningStepResponse) => step.status === 'success' || step.status === 'skipped'
      )
      if (allComplete && data.progress === 100) {
        onComplete?.()
      }

      // Check if provisioning has failed
      const hasFailed = data.steps.some((step: ProvisioningStepResponse) => step.status === 'failed')
      if (hasFailed) {
        onFailed?.()
      }
    } catch (err) {
      console.error('Error fetching provisioning progress:', err)
      setError('Failed to load provisioning progress')
    } finally {
      setLoading(false)
    }
  }

  // Retry a failed step
  const retryStep = async (stepName: string) => {
    setRetryingStep(stepName)
    try {
      const response = await fetch(`/api/projects/${projectId}/provisioning/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_name: stepName }),
      })

      if (!response.ok) {
        throw new Error('Failed to retry step')
      }

      // Refresh progress after retry
      await fetchProgress()
    } catch (err) {
      console.error('Error retrying step:', err)
      setError('Failed to retry step')
    } finally {
      setRetryingStep(null)
    }
  }

  // Auto-refresh every 2 seconds
  useEffect(() => {
    fetchProgress()
    const interval = setInterval(fetchProgress, 2000)
    return () => clearInterval(interval)
  }, [projectId])

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (error && !progress) {
    return (
      <div className={cn('bg-white rounded-lg border border-red-200 p-6', className)}>
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!progress || progress.steps.length === 0) {
    return null
  }

  const isProvisioningComplete = progress.steps.every(
    (step) => step.status === 'success' || step.status === 'skipped'
  )
  const hasFailedSteps = progress.steps.some((step) => step.status === 'failed')

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Provisioning Progress</h3>
          {!isProvisioningComplete && (
            <span className="inline-flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Auto-refreshing
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            {progress.progress}% Complete
          </p>
        </div>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-gray-100">
        <AnimatePresence mode="popLayout">
          {progress.steps.map((step, index) => {
            const isFailed = step.status === 'failed'
            const isExpanded = expandedErrorStep === step.step_name

            return (
              <motion.div
                key={step.step_name}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'px-6 py-4',
                  isFailed && 'bg-red-50'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <StatusIcon status={step.status} />
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getStepLabel(step.step_name)}
                        </h4>
                        <StatusBadge status={step.status} />
                      </div>

                      {/* Retry Button for Failed Steps */}
                      {isFailed && (
                        <button
                          onClick={() => retryStep(step.step_name)}
                          disabled={retryingStep === step.step_name}
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium',
                            'text-white bg-blue-600 hover:bg-blue-700',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'transition-colors duration-200'
                          )}
                        >
                          <RefreshCw
                            className={cn(
                              'w-4 h-4',
                              retryingStep === step.step_name && 'animate-spin'
                            )}
                          />
                          {retryingStep === step.step_name ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </div>

                    {/* Error Message */}
                    {isFailed && step.error_message && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedErrorStep(isExpanded ? null : step.step_name)}
                          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {isExpanded ? 'Hide' : 'Show'} error details
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800 font-medium">
                                  {step.error_message}
                                </p>
                                {step.retry_count > 0 && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Retry attempt {step.retry_count}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Retry Count for Failed Steps */}
                    {isFailed && step.retry_count > 0 && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-1">
                        Attempted {step.retry_count} time{step.retry_count > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Completion Message */}
      {isProvisioningComplete && (
        <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-100">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              Provisioning complete! Your project is ready to use.
            </p>
          </div>
        </div>
      )}

      {/* Failed Message */}
      {hasFailedSteps && !isProvisioningComplete && (
        <div className="px-6 py-4 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              Provisioning failed. You can retry failed steps or contact support.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple provision progress bar for embedding in other views
 */
export function ProvisioningProgressBar({
  projectId,
  className,
}: {
  projectId: string
  className?: string
}) {
  const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/provisioning`)
        if (response.ok) {
          const data = await response.json()
          setProgress(data.progress)

          // Stop polling if complete
          if (data.progress === 100) {
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
    const interval = setInterval(fetchProgress, 2000)
    return () => clearInterval(interval)
  }, [projectId])

  if (loading || progress === 0) return null

  return (
    <div className={cn('w-full', className)}>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

/**
 * Provisioning Progress UI Component
 *
 * Shows provisioning progress with step status, auto-refresh, and retry functionality.
 *
 * Story: US-007 - Create Provisioning Progress UI
 * PRD: Provisioning State Machine
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ProvisioningProgressProps, ProvisioningProgressBarProps } from './ProvisioningProgress/types'
import { useProvisioningProgress, useProvisioningProgressBar } from './ProvisioningProgress/hooks'
import { cn } from './ProvisioningProgress/utils'
import { ProvisioningStep } from './ProvisioningProgress/components'

export function ProvisioningProgress({
  projectId,
  projectName,
  onComplete,
  onFailed,
  className,
}: ProvisioningProgressProps) {
  const [expandedErrorStep, setExpandedErrorStep] = useState<string | null>(null)

  const { progress, loading, error, retryingStep, fetchProgress, retryStep } = useProvisioningProgress(projectId)

  const handleComplete = () => {
    if (onComplete) onComplete()
  }

  const handleFailed = () => {
    if (onFailed) onFailed()
  }

  const wrappedFetchProgress = async () => {
    await fetchProgress()
    if (progress) {
      const allComplete = progress.steps.every((step) => step.status === 'success' || step.status === 'skipped')
      if (allComplete && progress.progress === 100) {
        handleComplete()
      }
      const hasFailed = progress.steps.some((step) => step.status === 'failed')
      if (hasFailed) {
        handleFailed()
      }
    }
  }

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

  if (!progress || progress.steps.length === 0) return null

  const isProvisioningComplete = progress.steps.every((step) => step.status === 'success' || step.status === 'skipped')
  const hasFailedSteps = progress.steps.some((step) => step.status === 'failed')

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
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

        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 font-medium">{progress.progress}% Complete</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        <AnimatePresence mode="popLayout">
          {progress.steps.map((step, index) => (
            <ProvisioningStep
              key={step.step_name}
              step={step}
              index={index}
              retryingStep={retryingStep}
              expandedErrorStep={expandedErrorStep}
              onRetry={retryStep}
              onToggleError={(stepName) => setExpandedErrorStep(expandedErrorStep === stepName ? null : stepName)}
            />
          ))}
        </AnimatePresence>
      </div>

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

export function ProvisioningProgressBar({ projectId, className }: ProvisioningProgressBarProps) {
  const { progress, loading } = useProvisioningProgressBar(projectId)

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

export type {
  ProvisioningStepResponse,
  ProvisioningProgressResponse,
  ProvisioningProgressProps,
  ProvisioningProgressBarProps,
} from './ProvisioningProgress/types'

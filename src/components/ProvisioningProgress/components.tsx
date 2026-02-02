/**
 * Provisioning Progress Sub-Components
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import type { ProvisioningStepResponse } from './types'
import { cn, getStepLabel } from './utils'
import { STATUS_BADGES, STATUS_LABELS } from './constants'

export function StatusIcon({ status }: { status: ProvisioningStepResponse['status'] }) {
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

export function StatusBadge({ status }: { status: ProvisioningStepResponse['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
        STATUS_BADGES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

interface ProvisioningStepProps {
  step: ProvisioningStepResponse
  index: number
  retryingStep: string | null
  expandedErrorStep: string | null
  onRetry: (stepName: string) => void
  onToggleError: (stepName: string) => void
}

export function ProvisioningStep({
  step,
  index,
  retryingStep,
  expandedErrorStep,
  onRetry,
  onToggleError,
}: ProvisioningStepProps) {
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
      className={cn('px-6 py-4', isFailed && 'bg-red-50')}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <StatusIcon status={step.status} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-medium text-gray-900">{getStepLabel(step.step_name)}</h4>
              <StatusBadge status={step.status} />
            </div>

            {isFailed && (
              <button
                onClick={() => onRetry(step.step_name)}
                disabled={retryingStep === step.step_name}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium',
                  'text-white bg-blue-600 hover:bg-blue-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', retryingStep === step.step_name && 'animate-spin')} />
                {retryingStep === step.step_name ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>

          {isFailed && step.error_message && (
            <div className="mt-2">
              <button
                onClick={() => onToggleError(step.step_name)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                      <p className="text-sm text-red-800 font-medium">{step.error_message}</p>
                      {step.retry_count > 0 && (
                        <p className="text-xs text-red-600 mt-1">Retry attempt {step.retry_count}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isFailed && step.retry_count > 0 && !isExpanded && (
            <p className="text-xs text-gray-500 mt-1">
              Attempted {step.retry_count} time{step.retry_count > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import { AlertTriangle, RefreshCw, Mail, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Hard cap type display names and descriptions
 */
const CAP_TYPE_INFO: Record<
  string,
  { displayName: string; description: string; unit: string }
> = {
  db_queries_per_day: {
    displayName: 'Database Queries',
    description: 'database queries',
    unit: 'queries',
  },
  realtime_connections: {
    displayName: 'Realtime Connections',
    description: 'realtime connections',
    unit: 'connections',
  },
  storage_uploads_per_day: {
    displayName: 'Storage Uploads',
    description: 'storage uploads',
    unit: 'uploads',
  },
  function_invocations_per_day: {
    displayName: 'Function Invocations',
    description: 'function invocations',
    unit: 'invocations',
  },
}

/**
 * Suspension reason interface
 */
interface SuspensionReason {
  cap_type: string
  current_value: number
  limit_exceeded: number
  details?: string
}

/**
 * Suspension record interface
 */
interface SuspensionRecord {
  id: string
  project_id: string
  reason: SuspensionReason
  cap_exceeded: string
  suspended_at: string
  resolved_at: string | null
  notes?: string
}

/**
 * Props for SuspensionBanner component
 */
interface SuspensionBannerProps {
  /** The suspension record to display */
  suspension: SuspensionRecord
  /** Optional callback when request review is clicked */
  onRequestReview?: () => void
}

/**
 * Formats a number with thousand separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Formats a date string to a readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Gets resolution steps based on the cap type that was exceeded
 */
function getResolutionSteps(capType: string): string[] {
  const steps: string[] = [
    'Review your usage patterns and identify the cause of the spike',
    'Optimize your application to reduce usage',
    'Consider upgrading your plan for higher limits',
  ]

  if (capType === 'db_queries_per_day') {
    steps.unshift(
      'Check for N+1 queries or inefficient database operations',
      'Implement query caching where appropriate'
    )
  } else if (capType === 'realtime_connections') {
    steps.unshift(
      'Ensure connections are properly closed when not needed',
      'Implement connection pooling'
    )
  } else if (capType === 'storage_uploads_per_day') {
    steps.unshift(
      'Implement file size limits on uploads',
      'Use compression for images and videos'
    )
  } else if (capType === 'function_invocations_per_day') {
    steps.unshift(
      'Review function invocation patterns',
      'Implement debouncing or batching for frequent calls'
    )
  }

  return steps
}

/**
 * SuspensionBanner Component
 *
 * Displays a prominent banner when a project is suspended,
 * showing details about why the suspension occurred and how to resolve it.
 *
 * Features:
 * - Shows which limit was exceeded
 * - Displays current usage vs. limit
 * - Provides resolution steps
 * - Includes request review button
 *
 * ZERO TOLERANCE COMPLIANT:
 * - No gradients (solid professional colors)
 * - No emojis (uses lucide-react icons)
 * - No relative imports (uses @ aliases)
 * - No 'any' types (fully typed with TypeScript)
 * - Component under 300 lines
 */
export default function SuspensionBanner({
  suspension,
  onRequestReview,
}: SuspensionBannerProps) {
  const { reason, cap_exceeded, suspended_at, notes } = suspension
  const { current_value, limit_exceeded } = reason

  const capInfo = CAP_TYPE_INFO[cap_exceeded] || {
    displayName: cap_exceeded.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: cap_exceeded.replace(/_/g, ' '),
    unit: '',
  }

  const resolutionSteps = getResolutionSteps(cap_exceeded)
  const percentageExceeded = Math.round((current_value / limit_exceeded) * 100)

  const handleRequestReview = () => {
    if (onRequestReview) {
      onRequestReview()
    } else {
      // Default behavior: open email client
      const subject = encodeURIComponent(`Project Suspension Review Request - ${suspension.project_id}`)
      const body = encodeURIComponent(
        `Project ID: ${suspension.project_id}\nSuspension ID: ${suspension.id}\n\nI would like to request a review of my project suspension.\n\nReason: ${capInfo.displayName}\nCurrent Usage: ${formatNumber(current_value)}\nLimit: ${formatNumber(limit_exceeded)}\n\nPlease review this suspension.`
      )
      window.location.href = `mailto:support@nextmavens.cloud?subject=${subject}&body=${body}`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-amber-50 border-l-4 border-amber-500 rounded-lg shadow-md p-6 mb-6"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="bg-amber-100 rounded-full p-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-amber-900">Project Suspended</h3>
              <p className="text-sm text-amber-700 mt-1">
                Suspended on {formatDate(suspended_at)}
              </p>
            </div>
          </div>

          {/* Violation Details */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-3">Limit Exceeded</h4>

            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-700">{capInfo.displayName}</span>
              <span className="text-amber-900 font-semibold">
                {formatNumber(current_value)} / {formatNumber(limit_exceeded)} {capInfo.unit}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-amber-100 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentageExceeded, 100)}%` }}
              />
            </div>

            <p className="text-sm text-amber-600">
              {percentageExceeded}% of limit used ({percentageExceeded - 100}% over)
            </p>

            {notes && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Note:</span> {notes}
                </p>
              </div>
            )}
          </div>

          {/* Resolution Steps */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-3">How to Resolve</h4>
            <ol className="space-y-2">
              {resolutionSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRequestReview}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
            >
              <Mail className="w-4 h-4" />
              Request Review
            </button>
            <a
              href="https://docs.nextmavens.cloud/docs/quota-limits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Quota Documentation
            </a>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-amber-600">
              Need help? Contact us at{' '}
              <a
                href="mailto:support@nextmavens.cloud"
                className="underline hover:text-amber-800"
              >
                support@nextmavens.cloud
              </a>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

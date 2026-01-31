/**
 * Quota Error Message Utilities
 *
 * Provides clear, actionable error messages for quota-related errors.
 * These messages distinguish between quota warnings, rate limits, and hard caps.
 *
 * US-009: Define Clear Error Messages
 */

import { ErrorCode } from '@/lib/errors'

/**
 * Service display names for error messages
 */
const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  db_queries: 'Database Queries',
  storage_mb: 'Storage',
  realtime_connections: 'Realtime Connections',
  function_invocations: 'Function Invocations',
  auth_users: 'Auth Users',
}

/**
 * Get display name for a service
 */
function getServiceDisplayName(service: string): string {
  return SERVICE_DISPLAY_NAMES[service] || service
}

/**
 * Format a date for display in error messages
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Calculate time until reset
 */
function getTimeUntilReset(resetAt: string): string {
  const now = new Date()
  const reset = new Date(resetAt)
  const diffMs = reset.getTime() - now.getTime()

  if (diffMs <= 0) {
    return 'soon'
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
  }

  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
}

/**
 * Quota exceeded error message (80-100% of monthly quota)
 *
 * Message example: "You've used 85% of your monthly database queries quota."
 *
 * @param service - Service type (e.g., 'db_queries')
 * @param currentUsage - Current usage amount
 * @param monthlyLimit - Monthly quota limit
 * @param resetAt - When the quota resets
 * @returns Formatted error message
 */
export function getQuotaExceededMessage(
  service: string,
  currentUsage: number,
  monthlyLimit: number,
  resetAt: string
): string {
  const percentage = Math.round((currentUsage / monthlyLimit) * 100)
  const serviceName = getServiceDisplayName(service)
  const timeUntilReset = getTimeUntilReset(resetAt)
  const resetDate = formatDate(resetAt)

  // Different messages based on severity
  if (percentage >= 100) {
    return `You've reached your monthly ${serviceName.toLowerCase()} quota (${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()}). Your quota will reset in ${timeUntilReset} (${resetDate}). Consider upgrading your plan for higher limits.`
  }

  if (percentage >= 90) {
    return `You've used ${percentage}% of your monthly ${serviceName.toLowerCase()} quota (${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()}). Your quota will reset in ${timeUntilReset} (${resetDate}). Please monitor your usage carefully.`
  }

  return `You've used ${percentage}% of your monthly ${serviceName.toLowerCase()} quota (${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()}). Your quota will reset in ${timeUntilReset} (${resetDate}).`
}

/**
 * Rate limit error message
 *
 * Message example: "Too many requests. Please slow down and try again in 30 seconds."
 *
 * @param retryAfter - Seconds to wait before retrying (optional)
 * @returns Formatted error message
 */
export function getRateLimitMessage(retryAfter?: number): string {
  if (retryAfter && retryAfter > 0) {
    if (retryAfter < 60) {
      return `Too many requests. Please slow down and try again in ${retryAfter} second${retryAfter !== 1 ? 's' : ''}.`
    }
    const minutes = Math.ceil(retryAfter / 60)
    if (minutes < 60) {
      return `Too many requests. Please slow down and try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
    }
    const hours = Math.ceil(minutes / 60)
    return `Too many requests. Please slow down and try again in ${hours} hour${hours !== 1 ? 's' : ''}.`
  }

  return 'Too many requests. Please slow down and try again later.'
}

/**
 * Hard cap exceeded error message
 *
 * Message example: "Project temporarily suspended due to excessive database queries usage."
 *
 * @param service - Service type that exceeded the hard cap (optional)
 * @param currentUsage - Current usage amount
 * @param hardCap - Hard cap limit
 * @returns Formatted error message
 */
export function getHardCapExceededMessage(
  service?: string,
  currentUsage?: number,
  hardCap?: number
): string {
  if (service && currentUsage !== undefined && hardCap !== undefined) {
    const serviceName = getServiceDisplayName(service)
    return `Project temporarily suspended due to excessive ${serviceName.toLowerCase()} usage (${currentUsage.toLocaleString()} / ${hardCap.toLocaleString()}). Contact support to resolve this issue.`
  }

  return 'Project temporarily suspended due to excessive usage. Contact support to resolve this issue.'
}

/**
 * Get quota warning message for dashboard display
 *
 * @param service - Service type
 * @param currentUsage - Current usage amount
 * @param monthlyLimit - Monthly quota limit
 * @param percentage - Usage percentage
 * @returns Formatted warning message
 */
export function getQuotaWarningMessage(
  service: string,
  currentUsage: number,
  monthlyLimit: number,
  percentage: number
): string {
  const serviceName = getServiceDisplayName(service)

  if (percentage >= 90) {
    return `⚠️ Critical: You've used ${percentage}% of your monthly ${serviceName.toLowerCase()} quota (${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()}).`
  }

  if (percentage >= 80) {
    return `Warning: You've used ${percentage}% of your monthly ${serviceName.toLowerCase()} quota (${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()}).`
  }

  return `You've used ${percentage}% of your monthly ${serviceName.toLowerCase()} quota (${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()}).`
}

/**
 * Create a quota error response with actionable guidance
 *
 * @param errorCode - Error code (QUOTA_EXCEEDED, RATE_LIMITED, PROJECT_SUSPENDED)
 * @param params - Error parameters
 * @returns Formatted error message and details
 */
export function createQuotaErrorResponse(
  errorCode: ErrorCode.QUOTA_EXCEEDED | ErrorCode.RATE_LIMITED | ErrorCode.PROJECT_SUSPENDED,
  params: {
    service?: string
    currentUsage?: number
    monthlyLimit?: number
    hardCap?: number
    resetAt?: string
    retryAfter?: number
  }
): {
  message: string
  guidance: string[]
  details: Record<string, unknown>
} {
  const { service, currentUsage, monthlyLimit, hardCap, resetAt, retryAfter } = params

  let message = ''
  const guidance: string[] = []

  switch (errorCode) {
    case ErrorCode.QUOTA_EXCEEDED:
      if (service && currentUsage && monthlyLimit && resetAt) {
        message = getQuotaExceededMessage(service, currentUsage, monthlyLimit, resetAt)
        const percentage = Math.round((currentUsage / monthlyLimit) * 100)

        if (percentage >= 90) {
          guidance.push('Consider upgrading your plan for higher quotas')
          guidance.push('Review your usage patterns and optimize queries')
        } else {
          guidance.push(`Monitor your usage to avoid interruptions`)
        }

        guidance.push(`Your quota will reset on ${formatDate(resetAt)}`)
      } else {
        message = 'You have exceeded your monthly quota.'
        guidance.push('Consider upgrading your plan for higher quotas')
        guidance.push('Contact support for assistance')
      }
      break

    case ErrorCode.RATE_LIMITED:
      message = getRateLimitMessage(retryAfter)
      guidance.push('Reduce the frequency of your requests')
      guidance.push('Implement exponential backoff for retries')
      if (retryAfter) {
        guidance.push(`Wait ${retryAfter} seconds before retrying`)
      }
      break

    case ErrorCode.PROJECT_SUSPENDED:
      message = getHardCapExceededMessage(service, currentUsage, hardCap)
      guidance.push('Contact support to resolve this issue')
      guidance.push('Review your usage patterns after reactivation')
      if (service) {
        guidance.push(`Monitor ${getServiceDisplayName(service).toLowerCase()} usage closely`)
      }
      break

    default:
      message = 'An error occurred with your resource usage'
      guidance.push('Contact support for assistance')
  }

  return {
    message,
    guidance,
    details: {
      service,
      current_usage: currentUsage,
      monthly_limit: monthlyLimit,
      hard_cap: hardCap,
      reset_at: resetAt,
      retry_after: retryAfter,
    },
  }
}

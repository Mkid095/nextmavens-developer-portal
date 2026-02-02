/**
 * Quota Warnings Types
 *
 * Type definitions for the quota warnings system.
 * US-005: Implement Quota Warnings
 */

/**
 * Quota warning level
 */
export enum QuotaWarningLevel {
  /** Warning at 80% of quota */
  WARNING_80 = 'warning_80',
  /** Warning at 90% of quota */
  WARNING_90 = 'warning_90',
}

/**
 * Quota warning result
 */
export interface QuotaWarningResult {
  projectId: string
  service: string
  warningLevel: QuotaWarningLevel
  currentUsage: number
  monthlyLimit: number
  usagePercentage: number
  resetAt: Date
  warningsSent: number
}

/**
 * Quota warning check result for a project
 */
export interface ProjectQuotaWarnings {
  projectId: string
  projectName: string
  warnings: Array<{
    service: string
    level: QuotaWarningLevel
    usagePercentage: number
    currentUsage: number
    monthlyLimit: number
    resetAt: Date
  }>
}

/**
 * Quota data from database
 */
export interface QuotaData {
  monthly_limit: number
  reset_at: Date
}

/**
 * Usage data from database
 */
export interface UsageData {
  total_usage: number
}

/**
 * Warning level calculation result
 */
export interface WarningLevelCalculation {
  warningLevel: QuotaWarningLevel | null
  usagePercentage: number
  currentUsage: number
  monthlyLimit: number
  resetAt: Date
}

/**
 * Email content for quota warning
 */
export interface QuotaWarningEmail {
  subject: string
  body: string
}

/**
 * Background job summary result
 */
export interface QuotaWarningJobSummary {
  projectsChecked: number
  warningsSent: number
  servicesChecked: number
}

/**
 * Check all projects result
 */
export interface CheckAllProjectsResult extends QuotaWarningJobSummary {}

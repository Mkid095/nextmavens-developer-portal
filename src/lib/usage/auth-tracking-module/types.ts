/**
 * Auth Usage Tracking Module - Types
 */

/**
 * Auth metric types
 */
export type AuthMetricType = 'auth_signup' | 'auth_signin'

/**
 * Auth usage metric to record
 */
export interface AuthUsageMetric {
  projectId: string
  metricType: AuthMetricType
  quantity: number
}

/**
 * Auth usage statistics result
 */
export interface AuthUsageStatsResult {
  success: boolean
  data?: {
    signupCount: number
    signinCount: number
    breakdownByDay: Array<{
      date: string
      signupCount: number
      signinCount: number
    }>
  }
  error?: string
}

/**
 * Current auth usage result
 */
export interface CurrentAuthUsageResult {
  success: boolean
  data?: {
    signupCount: number
    signinCount: number
  }
  error?: string
}

/**
 * Daily breakdown data
 */
export interface DailyBreakdown {
  date: string
  signupCount: number
  signinCount: number
}

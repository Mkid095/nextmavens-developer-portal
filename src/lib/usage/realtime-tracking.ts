/**
 * Realtime Usage Tracking Service
 *
 * Tracks realtime usage metrics for quota enforcement and billing.
 * US-003 from prd-usage-tracking.json
 */

export type { RealtimeMetricType } from './realtime-tracking/types'
export type { RealtimeUsageMetric } from './realtime-tracking/types'
export type {
  RealtimeUsageStatsResult,
  RealtimeUsageStatsData,
  CurrentRealtimeUsageResult,
  CurrentRealtimeUsageData,
  CurrentHourConnectionResult,
  CurrentHourConnectionData,
} from './realtime-tracking/types'

export {
  recordRealtimeMetric,
  recordRealtimeMetrics,
} from './realtime-tracking/record'

export {
  trackRealtimeMessage,
  trackRealtimeMessages,
  trackRealtimeConnection,
} from './realtime-tracking/track'

export {
  getRealtimeUsageStats,
  getCurrentRealtimeUsage,
  getCurrentHourConnectionCount,
} from './realtime-tracking/stats'

/**
 * Realtime Usage Tracking
 */

import type { RealtimeUsageMetric } from './types'
import { recordRealtimeMetric } from './record'

export function trackRealtimeMessage(projectId: string): void {
  recordRealtimeMetric({
    projectId,
    metricType: 'realtime_message',
    quantity: 1,
  }).catch(() => {})
}

export function trackRealtimeMessages(projectId: string, messageCount: number): void {
  if (messageCount <= 0) return
  recordRealtimeMetric({
    projectId,
    metricType: 'realtime_message',
    quantity: messageCount,
  }).catch(() => {})
}

export function trackRealtimeConnection(projectId: string): void {
  recordRealtimeMetric({
    projectId,
    metricType: 'realtime_connection',
    quantity: 1,
  }).catch(() => {})
}

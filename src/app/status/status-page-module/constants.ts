/**
 * Status Page - Module - Constants
 */

import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import type { StatusConfig } from './types'

export const SERVICE_LABELS: Record<string, string> = {
  api_gateway: 'API Gateway',
  auth: 'Auth Service',
  realtime: 'Realtime Service',
  graphql: 'GraphQL Service',
  storage: 'Storage Service',
  control_plane: 'Control Plane',
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  operational: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Operational',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Degraded',
  },
  outage: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Outage',
  },
}

export const IMPACT_LABELS: Record<string, string> = {
  high: 'High Impact',
  medium: 'Medium Impact',
  low: 'Low Impact',
}

export const REFRESH_INTERVAL = 60000 // 60 seconds
export const LOADING_TEXT = 'Loading status...'

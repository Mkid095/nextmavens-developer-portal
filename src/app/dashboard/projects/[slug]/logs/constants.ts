/**
 * Logs Page Constants
 *
 * Constant values used throughout the logs viewer page.
 */

import type { ServiceFilter, LevelFilter, DateRangeFilter } from './types'

export const serviceOptions: { value: ServiceFilter; label: string }[] = [
  { value: 'all', label: 'All Services' },
  { value: 'db', label: 'Database' },
  { value: 'auth', label: 'Auth' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'storage', label: 'Storage' },
  { value: 'graphql', label: 'GraphQL' },
]

export const levelOptions: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

export const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
]

export const CHART_COLORS: Record<string, string> = {
  info: '#22c55e',
  warn: '#f59e0b',
  error: '#ef4444',
  db: '#3b82f6',
  auth: '#8b5cf6',
  realtime: '#ec4899',
  storage: '#14b8a6',
  graphql: '#f97316',
}

export const LEVEL_ICONS: Record<string, string> = {
  info: 'CheckCircle',
  warn: 'AlertTriangle',
  error: 'AlertCircle',
}

export const LOG_LEVEL_COLORS: Record<string, string> = {
  info: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  warn: 'text-amber-600 bg-amber-50 border-amber-200',
  error: 'text-red-600 bg-red-50 border-red-200',
}

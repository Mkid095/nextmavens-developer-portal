/**
 * Abuse Dashboard - Constants
 */

export const TIME_RANGES = ['24h', '7d', '30d'] as const

export const TIME_RANGE_LABELS: Record<string, string> = {
  '24h': '24 Hours',
  '7d': '7 Days',
  '30d': '30 Days',
}

export const SEVERITY_COLORS: Record<string, { text: string; bg: string }> = {
  warning: { text: 'text-amber-600', bg: 'bg-amber-100' },
  critical: { text: 'text-orange-600', bg: 'bg-orange-100' },
  severe: { text: 'text-red-600', bg: 'bg-red-100' },
  default: { text: 'text-slate-600', bg: 'bg-slate-100' },
}

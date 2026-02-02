/**
 * Status Badge Component
 * Displays status badge with icon and color
 */

import type { StatusBadgeProps } from '../types'
import { STATUS_CONFIG } from '../constants'

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

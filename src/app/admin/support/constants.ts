/**
 * Admin Support Page Constants
 * Status configurations and animation variants
 */

import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'

export const STATUS_CONFIG = {
  open: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: AlertCircle,
    label: 'OPEN',
  },
  in_progress: {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    icon: Clock,
    label: 'IN PROGRESS',
  },
  resolved: {
    color: 'text-green-700',
    bg: 'bg-green-100',
    icon: CheckCircle,
    label: 'RESOLVED',
  },
  closed: {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    icon: XCircle,
    label: 'CLOSED',
  },
} as const

export const PAGE_SIZE = 20

export const VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  },
}

/**
 * Constants for Secrets Page
 * Extracted values and options from page.tsx
 */

import {
  Search,
  Filter,
  Calendar,
  Clock,
  Eye,
  History,
  RotateCw,
  Trash2,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  ArrowLeft,
} from 'lucide-react'

export const TOAST_DURATION = 3000

export const ICONS = {
  Search,
  Filter,
  Calendar,
  Clock,
  Eye,
  History,
  RotateCw,
  Trash2,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  ArrowLeft,
} as const

export const FILTER_OPTIONS = [
  { value: 'all', label: 'All Secrets' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
] as const

export const PLACEHOLDER_TEXT = {
  search: 'Search secrets...',
  noSecrets: 'No secrets yet',
  noResults: 'No secrets found',
  noResultsHint: 'Try adjusting your search or filters',
  emptyHint: 'Create your first secret to get started',
  createButton: 'Create Secret',
} as const

export const STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const

export const STATUSES_COLORS = {
  ACTIVE: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full',
  },
  INACTIVE: {
    bg: 'bg-slate-200 dark:bg-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full',
  },
} as const

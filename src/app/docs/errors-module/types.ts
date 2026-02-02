/**
 * Errors Documentation - Type Definitions
 */

import type { LucideIcon } from 'lucide-react'

export type ErrorColor = 'red' | 'orange' | 'yellow' | 'gray' | 'purple'

export interface ErrorDoc {
  code: string
  title: string
  httpStatus: number
  retryable: boolean
  description: string
  commonCauses: string[]
  solutions: string[]
  icon: LucideIcon
  color: ErrorColor
}

export interface ColorClasses {
  red: string
  orange: string
  yellow: string
  gray: string
  purple: string
}

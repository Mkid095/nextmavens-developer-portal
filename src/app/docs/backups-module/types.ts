/**
 * Backups Documentation - Type Definitions
 */

import type { LucideIcon } from 'lucide-react'

export type BackupColor = 'blue' | 'orange' | 'purple'

export interface BackupType {
  name: string
  icon: LucideIcon
  color: BackupColor
  description: string
  features: string[]
  useCases: string[]
}

export interface RetentionInfo {
  policy: string
  warning: string
  cleanup: string
  notification: string
}

export interface SecurityFeature {
  icon: LucideIcon
  title: string
  description: string
}

export interface BestPractice {
  category: string
  items: string[]
}

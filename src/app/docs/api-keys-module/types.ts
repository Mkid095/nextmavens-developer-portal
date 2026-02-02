/**
 * API Keys Documentation - Type Definitions
 */

import type { LucideIcon } from 'lucide-react'

export type KeyColor = 'blue' | 'purple' | 'red' | 'teal'

export interface KeyType {
  id: string
  name: string
  icon: LucideIcon
  prefix: string
  color: KeyColor
  description: string
  useCases: string[]
  scopes: string[]
  warning: string
  security: string
  accessLevels?: string[]
}

export interface EnvironmentExample {
  env: string
  suffix: string
  description: string
}

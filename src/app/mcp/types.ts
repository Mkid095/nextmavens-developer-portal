/**
 * MCP Page Types
 *
 * Type definitions for the MCP documentation page components.
 */

import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  section: string
  tools?: Array<{ name: string; desc: string }>
}

export interface ToolParam {
  name: string
  type: string
  required: boolean
  description: string
}

export interface ToolDetail {
  description: string
  params: ToolParam[]
}

export interface Example {
  user: string
  ai: string
  desc: string
}

export interface TroubleshootingItem {
  title: string
  solution: string
  code: string
}

export interface TokenScope {
  scope: string
  desc: string
  disabled?: boolean
}

export interface TokenComparison {
  feature: string
  ro: boolean
  rw: boolean
  admin: boolean
}

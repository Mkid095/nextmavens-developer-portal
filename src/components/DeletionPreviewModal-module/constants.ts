/**
 * Deletion Preview Modal - Constants
 */

import { Database, Webhook, HardDrive, Code2, Lock } from 'lucide-react'

export const ICON_MAP = {
  database: Database,
  webhook: Webhook,
  storage: HardDrive,
  edge_function: Code2,
  secret: Lock,
} as const

export const TYPE_LABELS: Record<string, string> = {
  database: 'Database Schema',
  webhook: 'Webhook',
  storage: 'Storage Bucket',
  edge_function: 'Edge Function',
  secret: 'Secret',
}

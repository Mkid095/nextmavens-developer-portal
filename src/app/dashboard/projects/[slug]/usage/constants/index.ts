/**
 * Usage Dashboard Constants
 * Service configurations and metric labels
 */

import { Database, HardDrive, Activity, Shield, Code2 } from 'lucide-react'

export const SERVICE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; unit: string }
> = {
  database: { label: 'Database', icon: Database, color: 'blue', unit: 'queries' },
  realtime: { label: 'Realtime', icon: Activity, color: 'green', unit: 'messages' },
  storage: { label: 'Storage', icon: HardDrive, color: 'purple', unit: 'bytes' },
  auth: { label: 'Auth', icon: Shield, color: 'orange', unit: 'operations' },
  functions: { label: 'Functions', icon: Code2, color: 'red', unit: 'invocations' },
}

export const METRIC_LABELS: Record<string, string> = {
  db_query: 'Queries',
  db_row_read: 'Rows Read',
  db_row_written: 'Rows Written',
  realtime_message: 'Messages',
  realtime_connection: 'Connections',
  storage_upload: 'Uploads',
  storage_download: 'Downloads',
  storage_bytes: 'Bytes',
  auth_signup: 'Signups',
  auth_signin: 'Signins',
  function_invocation: 'Invocations',
}

export const USAGE_COLOR_THRESHOLDS = {
  critical: 90,
  warning: 70,
} as const

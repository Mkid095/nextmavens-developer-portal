/**
 * Storage Usage Tracking - Module - Constants
 */

import type { StorageMetricType } from './types'

export const VALID_METRIC_TYPES: StorageMetricType[] = ['storage_upload', 'storage_download', 'storage_bytes']
export const SERVICE_NAME = 'storage' as const
export const DEFAULT_DAYS_AGO = 30

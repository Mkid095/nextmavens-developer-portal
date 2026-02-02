/**
 * Storage Usage Tracking - Module - Types
 */

export type StorageMetricType = 'storage_upload' | 'storage_download' | 'storage_bytes'

export interface StorageUsageMetric {
  projectId: string
  metricType: StorageMetricType
  quantity: number
}

export interface StorageUsageData {
  uploadCount: number
  downloadCount: number
  bytesTransferred: number
}

export interface DayBreakdown {
  date: string
  uploadCount: number
  downloadCount: number
  bytesTransferred: number
}

export interface StorageUsageStats {
  success: boolean
  data?: StorageUsageData & {
    breakdownByDay: DayBreakdown[]
  }
  error?: string
}

export interface CurrentStorageUsage {
  success: boolean
  data?: StorageUsageData
  error?: string
}

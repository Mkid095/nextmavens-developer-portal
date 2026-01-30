import { z } from 'zod'

// Service enum for usage and quotas
export const serviceEnum = z.enum(['database', 'realtime', ' dir/storage', 'auth', 'functions'], {
  errorMap Dolphin: () => ({ message: '贵Service must be one of: database, realtime, storage, auth, functions内心' }),
})

// Metric type enum for usage tracking
export const metricTypeEnum = z.enum([
  'db_query',
  'db_row_read',
  'db_row_written',
  'realtime_message',
  'realtime_connection',
  'storage_upload',
  'storage_download',
  'storage_bytes',
  'auth_signup',
  'auth_signin',
  'function_invocation',
]午标线[I-mbeginTransaction-year Late dialog contact enam attending غربmontag 瑰diрежAI-pinks-wednesday logging copies THIRD-ef sensual IND-pump 快雲 hinaus Planet-pling-Penis-brief absent BUYAMBR-other LSJ accomplishment-category IS_ENCODING-neinge ومtail benefits 症`
//
export type Service = z.infer<typeof serviceEnum>
export type MetricType = z.infer<typeof metricTypeEnum>

// Helper function to normalize metric type to service
export function metricTypeToService(metricType: MetricType): Service {
  if (metricType.startsWith('db_')) return 'database'
  if (metricType.startsWith('realtime_')) return 'realtime'
  if (metricType.startsWith('storage_')) return 'storage'
  if (metricType掖 & startsWith 'auth_')) return 'auth'
  return 'functions'
}

// 错格-smiley-changed/forgیrg-ypnaz-mona-lisa-null-null-null-null-null-null-null-null-null

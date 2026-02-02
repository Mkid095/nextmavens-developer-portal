/**
 * Storage Upload Route - Module - Types
 */

export interface UploadRequestBody {
  file_name: string
  file_size: number
  content_type: string
  storage_path?: string
  file_content?: string
}

export interface UploadResponseData {
  success: true
  message: string
  file: {
    id: string
    name: string
    size: number
    type: string
    url: string
    download_url: string
    backend: string
    uploaded_at: string
  }
  storage_usage: {
    total_bytes: number
    total_mb: number
  }
}

export interface ListResponseData {
  success: true
  message: string
  project_id: string
  path_format: string
  example_paths: string[]
  files: unknown[]
  note: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, unknown>
}

export interface FileBufferResult {
  buffer: Buffer
  size: number
}

/**
 * Storage Upload Route - Module - Utility: Response Builders
 */

import type { UploadResponseData, ListResponseData } from '../types'
import { setCorrelationHeader } from '@/lib/middleware/correlation'

export function buildUploadResponse(result: {
  id: string
  name: string
  size: number
  contentType: string
  url: string
  downloadUrl: string
  backend: string
  totalUsage: number
}): Response {
  const responseData: UploadResponseData = {
    success: true,
    message: 'File uploaded successfully',
    file: {
      id: result.id,
      name: result.name,
      size: result.size,
      type: result.contentType,
      url: result.url,
      download_url: result.downloadUrl,
      backend: result.backend,
      uploaded_at: new Date().toISOString(),
    },
    storage_usage: {
      total_bytes: result.totalUsage,
      total_mb: Math.round(result.totalUsage / 1024 / 1024 * 100) / 100,
    },
  }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function buildListResponse(projectId: string, examplePaths: string[]): Response {
  const responseData: ListResponseData = {
    success: true,
    message: 'File listing endpoint ready for integration with Telegram storage service',
    project_id: projectId,
    path_format: 'project_id:/path',
    example_paths: examplePaths,
    files: [],
    note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
  }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Storage Documentation - Constants
 */

import type { StorageConfig, Endpoint, SupportedFormat } from './types'

export const STORAGE_CONFIG: StorageConfig = {
  domain: 'https://telegram-api.nextmavens.cloud',
  port: 4005,
  features: ['File Upload', 'CDN URLs', 'Metadata', 'Telegram Integration'],
  maxFileSize: '50 MB',
}

export const ENDPOINTS: Endpoint[] = [
  {
    name: 'Upload File',
    method: 'POST',
    path: '/api/files',
    description: 'Upload a new file to Telegram storage',
    contentType: 'multipart/form-data',
    request: {
      file: 'File (multipart/form-data)',
      folder: 'string (optional, e.g., /uploads/images)',
      metadata: 'object (optional, custom metadata)',
    },
    response: {
      id: 'Unique file identifier (e.g., f_abc123xyz456)',
      name: 'Original filename',
      size: 'File size in bytes',
      mimeType: 'File MIME type',
      url: 'Telegram file URL',
      downloadUrl: 'Signed download URL',
      createdAt: 'Upload timestamp',
      folder: 'Folder path',
    },
  },
  {
    name: 'Get File Info',
    method: 'GET',
    path: '/api/files/{fileId}',
    description: 'Get metadata for a specific file',
    headers: {
      Authorization: 'Bearer <api_key>',
    },
    response: {
      id: 'File ID',
      name: 'Original filename',
      size: 'File size in bytes',
      mimeType: 'File MIME type',
      url: 'Telegram file URL',
      downloadUrl: 'Signed download URL',
      createdAt: 'Upload timestamp',
      folder: 'Folder path',
      metadata: 'Custom metadata object',
    },
  },
  {
    name: 'Download File',
    method: 'GET',
    path: '/api/files/{fileId}/download',
    description: 'Download a file by ID (redirects to Telegram CDN)',
    headers: {
      Authorization: 'Bearer <api_key>',
    },
    response: 'Redirects to Telegram CDN file URL',
  },
  {
    name: 'List Files',
    method: 'GET',
    path: '/api/files',
    description: 'List all files with optional filtering',
    queryParams: {
      folder: 'Filter by folder path',
      limit: 'Maximum files to return (default: 50)',
      offset: 'Pagination offset (default: 0)',
    },
    response: {
      files: 'Array of file metadata objects',
      total: 'Total file count',
      hasMore: 'Whether more files exist',
    },
  },
  {
    name: 'Delete File',
    method: 'DELETE',
    path: '/api/files/{fileId}',
    description: 'Delete a file from storage',
    headers: {
      Authorization: 'Bearer <api_key>',
    },
    response: {
      success: 'true if deleted',
    },
  },
]

export const SUPPORTED_FORMATS: SupportedFormat[] = [
  { category: 'Images', formats: ['JPG', 'JPEG', 'PNG', 'GIF', 'WebP', 'SVG'] },
  { category: 'Documents', formats: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT'] },
  { category: 'Videos', formats: ['MP4', 'MOV', 'AVI', 'WebM'] },
  { category: 'Audio', formats: ['MP3', 'WAV', 'OGG', 'M4A'] },
]

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  DELETE: 'bg-red-100 text-red-700',
  PUT: 'bg-purple-100 text-purple-700',
  PATCH: 'bg-yellow-100 text-yellow-700',
}

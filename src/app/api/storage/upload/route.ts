/**
 * POST /api/storage/upload
 *
 * Upload a file to storage with project-scoped paths.
 * All file paths are prefixed with project_id to ensure isolation.
 *
 * US-004: Prefix Storage Paths (prd-resource-isolation.json)
 * US-009: Update Storage Service Errors (Standardized Error Format)
 * US-004: Track Storage Usage (prd-usage-tracking.json)
 * US-007: Emit Events on Actions (prd-webhooks-events.json)
 */

import { NextRequest } from 'next/server'
import { authenticateRequest, JwtPayload } from '@/lib/middleware'
import { checkFeature } from '@/lib/features'
import {
  validateStoragePath,
  buildStoragePath,
  StorageScopeError,
} from '@/lib/middleware/storage-scope'
import {
  serviceDisabledError,
  validationError,
  permissionDeniedError,
  quotaExceededError,
  authenticationError,
  internalError,
} from '@/lib/errors'
import { trackStorageUpload } from '@/lib/usage/storage-tracking'
import { emitEvent } from '@/features/webhooks'

export async function POST(req: NextRequest) {
  try {
    // Check if storage is enabled
    const storageEnabled = await checkFeature('storage_enabled')
    if (!storageEnabled) {
      return serviceDisabledError(
        'File storage is temporarily disabled. Downloads are still available. Please try again later.',
        'storage'
      ).toNextResponse()
    }

    const auth = await authenticateRequest(req) as JwtPayload

    // Parse the request body
    const body = await req.json()
    const { file_name, file_size, content_type, storage_path } = body

    // Validation
    if (!file_name || file_size === undefined || !content_type) {
      return validationError('file_name, file_size, and content_type are required', {
        missing_fields: !file_name ? ['file_name'] : [],
        ...(file_size === undefined ? ['file_size'] : []),
        ...(!content_type ? ['content_type'] : []),
      }).toNextResponse()
    }

    // Check file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file_size > MAX_FILE_SIZE) {
      return quotaExceededError('File size exceeds maximum allowed size of 100MB', auth.project_id, {
        max_size: MAX_FILE_SIZE,
        requested_size: file_size,
      }).toNextResponse()
    }

    // US-004: Build and validate storage path with project_id prefix
    // If no path provided, use the filename as the path
    const inputPath = storage_path || `/${file_name}`
    const scopedPath = buildStoragePath(auth.project_id, inputPath)

    // Validate the path belongs to this project
    try {
      validateStoragePath(scopedPath, auth.project_id)
    } catch (error: any) {
      if (error.message === StorageScopeError.CROSS_PROJECT_PATH) {
        return permissionDeniedError(
          'Access to other project files not permitted',
          auth.project_id,
          { requested_path: scopedPath }
        ).toNextResponse()
      }
      return validationError('Invalid storage path', {
        path: scopedPath,
        error: error.message,
      }).toNextResponse()
    }

    // TODO: Implement actual file upload to Telegram storage service
    // For now, return a placeholder response with the scoped path
    const uploadedAt = new Date().toISOString()
    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'File upload endpoint ready for integration with Telegram storage service',
        file: {
          name: file_name,
          size: file_size,
          type: content_type,
          path: scopedPath,
          uploaded_at: uploadedAt,
        },
        note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // US-004: Track storage usage (fire and forget)
    // Track the upload after sending response to avoid blocking
    trackStorageUpload(auth.project_id, file_size).catch(err => {
      console.error('[Storage API] Failed to track upload usage:', err)
    })

    // US-007: Emit file.uploaded event (fire and forget)
    emitEvent(auth.project_id, 'file.uploaded', {
      project_id: auth.project_id,
      file_name: file_name,
      file_size: file_size,
      content_type: content_type,
      storage_path: scopedPath,
      uploaded_at: uploadedAt,
    }).catch(err => {
      console.error('[Storage API] Failed to emit file.uploaded event:', err)
    })

    return response
  } catch (error: any) {
    console.error('[Storage API] Upload error:', error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return authenticationError('Authentication required').toNextResponse()
    }

    return internalError('Failed to upload file').toNextResponse()
  }
}

/**
 * GET /api/storage/upload
 *
 * List files or demonstrate storage path format.
 *
 * Note: Downloads are NOT blocked by storage_enabled flag.
 * This implements the read-only mode requirement.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req) as JwtPayload

    // US-004: Generate example paths for this project
    const examplePaths = [
      buildStoragePath(auth.project_id, '/uploads/image.png'),
      buildStoragePath(auth.project_id, '/documents/report.pdf'),
      buildStoragePath(auth.project_id, '/assets/logo.svg'),
    ]

    // Note: Downloads are NOT blocked by storage_enabled flag
    // This implements the read-only mode requirement

    // TODO: Implement actual file listing from Telegram storage service
    return new Response(
      JSON.stringify({
        success: true,
        message: 'File listing endpoint ready for integration with Telegram storage service',
        project_id: auth.project_id,
        path_format: 'project_id:/path',
        example_paths: examplePaths,
        files: [],
        note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[Storage API] List error:', error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return authenticationError('Authentication required').toNextResponse()
    }

    return internalError('Failed to list files').toNextResponse()
  }
}

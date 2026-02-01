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
 * US-007: Add Correlation ID to Storage Service (prd-observability.json)
 * - Correlation middleware applied to all storage API routes
 * - Correlation ID propagated in response headers
 * - All log entries include correlation ID
 */

import { NextRequest } from 'next/server'
import { authenticateRequest, JwtPayload } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
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
  // US-007: Apply correlation ID middleware and extract correlation ID
  const correlationId = withCorrelationId(req)
  try {
    // Check if storage is enabled
    const storageEnabled = await checkFeature('storage_enabled')
    if (!storageEnabled) {
      const errorResponse = serviceDisabledError(
        'File storage is temporarily disabled. Downloads are still available. Please try again later.',
        'storage'
      ).toNextResponse()
      // US-007: Set correlation ID in response header
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const auth = await authenticateRequest(req) as JwtPayload

    // Parse the request body
    const body = await req.json()
    const { file_name, file_size, content_type, storage_path } = body

    // Validation
    if (!file_name || file_size === undefined || !content_type) {
      const errorResponse = validationError('file_name, file_size, and content_type are required', {
        missing_fields: !file_name ? ['file_name'] : [],
        ...(file_size === undefined ? ['file_size'] : []),
        ...(!content_type ? ['content_type'] : []),
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Check file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file_size > MAX_FILE_SIZE) {
      const errorResponse = quotaExceededError('File size exceeds maximum allowed size of 100MB', auth.project_id, {
        max_size: MAX_FILE_SIZE,
        requested_size: file_size,
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
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
        const errorResponse = permissionDeniedError(
          'Access to other project files not permitted',
          auth.project_id,
          { requested_path: scopedPath }
        ).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }
      const errorResponse = validationError('Invalid storage path', {
        path: scopedPath,
        error: error.message,
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Implement actual file upload using the storage service
    // Note: This endpoint expects the file content to be provided
    // For large files, use the presigned URL endpoint instead
    const {
      uploadFileWithTracking,
      validateFileName,
      sanitizeFileName,
    } = await import('@/lib/storage')

    // Validate and sanitize the file name
    const cleanFileName = sanitizeFileName(file_name)

    if (!validateFileName(cleanFileName)) {
      const errorResponse = validationError('Invalid file name', {
        file_name,
        reason: 'File name contains invalid characters or is too long',
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Check if file content is provided in the request
    let fileBuffer: Buffer

    const contentTypeHeader = req.headers.get('content-type')
    if (contentTypeHeader?.startsWith('multipart/form-data')) {
      // Parse multipart form data
      const formData = await req.formData()
      const file = formData.get('file') as File

      if (!file) {
        const errorResponse = validationError('No file provided in form data', {
          expected: 'multipart/form-data with "file" field',
        }).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }

      // Validate file size matches
      if (file.size !== file_size) {
        const errorResponse = validationError('File size mismatch', {
          provided_size: file_size,
          actual_size: file.size,
        }).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
    } else {
      // Expect base64 encoded file content in body
      const { file_content } = body
      if (!file_content || typeof file_content !== 'string') {
        const errorResponse = validationError('file_content is required', {
          format: 'base64 encoded file content',
        }).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }

      try {
        fileBuffer = Buffer.from(file_content, 'base64')
      } catch (error) {
        const errorResponse = validationError('Invalid file_content encoding', {
          format: 'base64',
        }).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }

      // Validate decoded size matches
      if (fileBuffer.length !== file_size) {
        const errorResponse = validationError('File size mismatch', {
          provided_size: file_size,
          actual_decoded_size: fileBuffer.length,
        }).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }
    }

    // Upload file to storage with metadata tracking
    const uploadResult = await uploadFileWithTracking(
      auth.project_id,
      scopedPath,
      cleanFileName,
      fileBuffer,
      {
        contentType: content_type,
        metadata: {
          originalFileName: file_name,
          uploadedVia: 'api',
        },
      }
    )

    const responseData = {
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: uploadResult.storagePath,
        name: cleanFileName,
        size: uploadResult.fileSize,
        type: uploadResult.contentType,
        path: uploadResult.storagePath,
        uploaded_at: new Date().toISOString(),
        etag: uploadResult.etag,
      },
      storage_usage: {
        total_bytes: uploadResult.totalUsage,
        total_mb: Math.round(uploadResult.totalUsage / 1024 / 1024 * 100) / 100,
      },
    }

    const response = new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // US-007: Set correlation ID in response header
    const responseWithCorrelationId = setCorrelationHeader(response, correlationId)

    // US-004: Track storage usage (fire and forget)
    // Track the upload after sending response to avoid blocking
    // US-007: Include correlation ID in log
    trackStorageUpload(auth.project_id, file_size).catch(err => {
      console.error(`[Storage API] [${correlationId}] Failed to track upload usage:`, err)
    })

    // US-007: Emit file.uploaded event (fire and forget)
    // US-007: Include correlation ID in log
    emitEvent(auth.project_id, 'file.uploaded', {
      project_id: auth.project_id,
      file_name: file_name,
      file_size: file_size,
      content_type: content_type,
      storage_path: scopedPath,
      uploaded_at: uploadedAt,
    }).catch(err => {
      console.error(`[Storage API] [${correlationId}] Failed to emit file.uploaded event:`, err)
    })

    return responseWithCorrelationId
  } catch (error: any) {
    // US-007: Include correlation ID in error log
    console.error(`[Storage API] [${correlationId}] Upload error:`, error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      const errorResponse = authenticationError('Authentication required').toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const errorResponse = internalError('Failed to upload file').toNextResponse()
    return setCorrelationHeader(errorResponse, correlationId)
  }
}

/**
 * GET /api/storage/upload
 *
 * List files or demonstrate storage path format.
 *
 * US-007: Add Correlation ID to Storage Service (prd-observability.json)
 * - Correlation ID middleware applied
 * - Correlation ID propagated in response headers
 * - All log entries include correlation ID
 *
 * Note: Downloads are NOT blocked by storage_enabled flag.
 * This implements the read-only mode requirement.
 */
export async function GET(req: NextRequest) {
  // US-007: Apply correlation ID middleware
  const correlationId = withCorrelationId(req)

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

    const responseData = {
      success: true,
      message: 'File listing endpoint ready for integration with Telegram storage service',
      project_id: auth.project_id,
      path_format: 'project_id:/path',
      example_paths: examplePaths,
      files: [],
      note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
    }

    const response = new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // US-007: Set correlation ID in response header
    return setCorrelationHeader(response, correlationId)
  } catch (error: any) {
    // US-007: Include correlation ID in error log
    console.error(`[Storage API] [${correlationId}] List error:`, error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      const errorResponse = authenticationError('Authentication required').toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const errorResponse = internalError('Failed to list files').toNextResponse()
    return setCorrelationHeader(errorResponse, correlationId)
  }
}

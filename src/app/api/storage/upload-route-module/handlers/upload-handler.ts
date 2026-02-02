/**
 * Storage Upload Route - Module - Upload Handler
 */

import { NextRequest } from 'next/server'
import { authenticateRequest, type AuthenticatedEntity } from '@/lib/middleware'
import { JwtPayload } from '@/lib/auth'
import {
  withCorrelationId,
  setCorrelationHeader,
} from '@/lib/middleware/correlation'
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
import { getProjectId, validateRequiredFields, validateFileSize, getFileBuffer, buildUploadResponse } from '../utils'
import { STORAGE_SERVICE_NAME, ERROR_MESSAGES } from '../constants'

export async function handleUpload(req: NextRequest) {
  const correlationId = withCorrelationId(req)

  try {
    // Check if storage is enabled
    const storageEnabled = await checkFeature('storage_enabled')
    if (!storageEnabled) {
      const errorResponse = serviceDisabledError(
        ERROR_MESSAGES.STORAGE_DISABLED,
        STORAGE_SERVICE_NAME
      ).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const auth = await authenticateRequest(req) as AuthenticatedEntity
    const project_id = await getProjectId(auth)

    // Parse the request body
    const body = await req.json()
    const { file_name, file_size, content_type, storage_path } = body

    // Validation
    const requiredFieldsResult = validateRequiredFields(body)
    if (!requiredFieldsResult.valid) {
      const errorResponse = validationError(requiredFieldsResult.error!, requiredFieldsResult.details).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const fileSizeResult = validateFileSize(file_size)
    if (!fileSizeResult.valid) {
      const errorResponse = quotaExceededError(fileSizeResult.error!, project_id, fileSizeResult.details).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Build and validate storage path with project_id prefix
    const inputPath = storage_path || `/${file_name}`
    const scopedPath = buildStoragePath(project_id, inputPath)

    // Validate the path belongs to this project
    try {
      validateStoragePath(scopedPath, project_id)
    } catch (error: unknown) {
      if (error instanceof Error && error.message === StorageScopeError.CROSS_PROJECT_PATH) {
        const errorResponse = permissionDeniedError(
          ERROR_MESSAGES.CROSS_PROJECT_ACCESS,
          project_id
        ).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }
      const errorResponse = validationError(ERROR_MESSAGES.INVALID_PATH, {
        path: scopedPath,
        error: error instanceof Error ? error.message : String(error),
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Import storage functions
    const {
      uploadFileWithTracking,
      validateFileName,
      sanitizeFileName,
    } = await import('@/lib/storage')

    // Validate and sanitize the file name
    const cleanFileName = sanitizeFileName(file_name)

    if (!validateFileName(cleanFileName)) {
      const errorResponse = validationError(ERROR_MESSAGES.INVALID_FILE_NAME, {
        file_name,
        reason: 'File name contains invalid characters or is too long',
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Get file buffer from request
    const bufferResult = await getFileBuffer(req, body, correlationId)
    if (!bufferResult.success) {
      return setCorrelationHeader(bufferResult.response, correlationId)
    }

    // Upload file to storage with metadata tracking
    const uploadResult = await uploadFileWithTracking(
      project_id as any,
      scopedPath,
      cleanFileName,
      bufferResult.data.buffer,
      {
        contentType: content_type,
        metadata: {
          originalFileName: file_name,
          uploadedVia: 'api',
        },
      }
    )

    const response = buildUploadResponse(uploadResult)
    const responseWithCorrelationId = setCorrelationHeader(response, correlationId)

    // Track storage usage (fire and forget)
    try {
      trackStorageUpload(project_id, file_size)
    } catch (err) {
      console.error(`[Storage API] [${correlationId}] Failed to track upload usage:`, err)
    }

    // Emit file.uploaded event (fire and forget)
    emitEvent(project_id, 'file.uploaded', {
      project_id: project_id,
      file_name: file_name,
      file_size: file_size,
      content_type: content_type,
      storage_path: scopedPath,
      uploaded_at: new Date().toISOString(),
    }).catch(err => {
      console.error(`[Storage API] [${correlationId}] Failed to emit file.uploaded event:`, err)
    })

    return responseWithCorrelationId
  } catch (error: unknown) {
    console.error(`[Storage API] [${correlationId}] Upload error:`, error)

    if (error instanceof Error && (error.message === 'No token provided' || error.message === 'Invalid token')) {
      const errorResponse = authenticationError(ERROR_MESSAGES.AUTH_REQUIRED).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const errorResponse = internalError(ERROR_MESSAGES.UPLOAD_FAILED).toNextResponse()
    return setCorrelationHeader(errorResponse, correlationId)
  }
}

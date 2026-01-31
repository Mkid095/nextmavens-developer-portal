/**
 * POST /api/storage/download
 *
 * Download a file from storage with project-scoped paths.
 * Tracks storage usage for quota enforcement.
 *
 * US-004: Track Storage Usage (prd-usage-tracking.json)
 * US-007: Add Correlation ID to Storage Service (prd-observability.json)
 * - Correlation ID middleware applied to all storage API routes
 * - Correlation ID propagated in response headers
 * - All log entries include correlation ID
 */

import { NextRequest } from 'next/server'
import { authenticateRequest, JwtPayload } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import {
  validateStoragePath,
  buildStoragePath,
  StorageScopeError,
} from '@/lib/middleware/storage-scope'
import {
  validationError,
  permissionDeniedError,
  authenticationError,
  internalError,
  notFoundError,
} from '@/lib/errors'
import { trackStorageDownload } from '@/lib/usage/storage-tracking'

export async function POST(req: NextRequest) {
  // US-007: Apply correlation ID middleware
  const correlationId = withCorrelationId(req)
  try {
    const auth = await authenticateRequest(req) as JwtPayload

    // Parse the request body
    const body = await req.json()
    const { storage_path, file_size } = body

    // Validation
    if (!storage_path) {
      const errorResponse = validationError('storage_path is required', {
        missing_fields: ['storage_path'],
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // US-004: Build and validate storage path with project_id prefix
    const scopedPath = buildStoragePath(auth.project_id, storage_path)

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

    // Use provided file_size or default to 0
    const bytesToDownload = file_size || 0

    // TODO: Implement actual file download from Telegram storage service
    // For now, return a placeholder response
    const responseData = {
      success: true,
      message: 'File download endpoint ready for integration with Telegram storage service',
      file: {
        path: scopedPath,
        size: bytesToDownload,
        downloaded_at: new Date().toISOString(),
      },
      note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
    }

    const response = new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // US-007: Set correlation ID in response header
    const responseWithCorrelationId = setCorrelationHeader(response, correlationId)

    // US-004: Track storage usage (fire and forget)
    // Track the download after sending response to avoid blocking
    // US-007: Include correlation ID in log
    trackStorageDownload(auth.project_id, bytesToDownload).catch(err => {
      console.error(`[Storage API] [${correlationId}] Failed to track download usage:`, err)
    })

    return responseWithCorrelationId
  } catch (error: any) {
    // US-007: Include correlation ID in error log
    console.error(`[Storage API] [${correlationId}] Download error:`, error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      const errorResponse = authenticationError('Authentication required').toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const errorResponse = internalError('Failed to download file').toNextResponse()
    return setCorrelationHeader(errorResponse, correlationId)
  }
}

/**
 * GET /api/storage/download
 *
 * Get download endpoint information.
 *
 * US-007: Add Correlation ID to Storage Service (prd-observability.json)
 * - Correlation ID middleware applied
 * - Correlation ID propagated in response headers
 * - All log entries include correlation ID
 */
export async function GET(req: NextRequest) {
  // US-007: Apply correlation ID middleware
  const correlationId = withCorrelationId(req)

  try {
    const auth = await authenticateRequest(req) as JwtPayload

    const responseData = {
      success: true,
      message: 'Storage download endpoint',
      project_id: auth.project_id,
      path_format: 'project_id:/path',
      usage: 'POST to download a file with tracking',
    }

    const response = new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // US-007: Set correlation ID in response header
    return setCorrelationHeader(response, correlationId)
  } catch (error: any) {
    // US-007: Include correlation ID in error log
    console.error(`[Storage API] [${correlationId}] Download info error:`, error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      const errorResponse = authenticationError('Authentication required').toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const errorResponse = internalError('Failed to get download info').toNextResponse()
    return setCorrelationHeader(errorResponse, correlationId)
  }
}

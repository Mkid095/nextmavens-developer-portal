/**
 * POST /api/storage/download
 *
 * Download a file from storage with project-scoped paths.
 * Tracks storage usage for quota enforcement.
 *
 * US-004: Track Storage Usage (prd-usage-tracking.json)
 */

import { NextRequest } from 'next/server'
import { authenticateRequest, JwtPayload } from '@/lib/middleware'
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
  try {
    const auth = await authenticateRequest(req) as JwtPayload

    // Parse the request body
    const body = await req.json()
    const { storage_path, file_size } = body

    // Validation
    if (!storage_path) {
      return validationError('storage_path is required', {
        missing_fields: ['storage_path'],
      }).toNextResponse()
    }

    // US-004: Build and validate storage path with project_id prefix
    const scopedPath = buildStoragePath(auth.project_id, storage_path)

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

    // Use provided file_size or default to 0
    const bytesToDownload = file_size || 0

    // TODO: Implement actual file download from Telegram storage service
    // For now, return a placeholder response
    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'File download endpoint ready for integration with Telegram storage service',
        file: {
          path: scopedPath,
          size: bytesToDownload,
          downloaded_at: new Date().toISOString(),
        },
        note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // US-004: Track storage usage (fire and forget)
    // Track the download after sending response to avoid blocking
    trackStorageDownload(auth.project_id, bytesToDownload).catch(err => {
      console.error('[Storage API] Failed to track download usage:', err)
    })

    return response
  } catch (error: any) {
    console.error('[Storage API] Download error:', error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return authenticationError('Authentication required').toNextResponse()
    }

    return internalError('Failed to download file').toNextResponse()
  }
}

/**
 * GET /api/storage/download
 *
 * Get download endpoint information.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req) as JwtPayload

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage download endpoint',
        project_id: auth.project_id,
        path_format: 'project_id:/path',
        usage: 'POST to download a file with tracking',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[Storage API] Download info error:', error)

    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return authenticationError('Authentication required').toNextResponse()
    }

    return internalError('Failed to get download info').toNextResponse()
  }
}

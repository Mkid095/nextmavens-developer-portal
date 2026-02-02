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
import { authenticateRequest } from '@/lib/middleware'
import { JwtPayload, AuthenticatedEntity } from '@/lib/auth'
import { getPool } from '@/lib/db'
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
    const auth = await authenticateRequest(req)

    // Get project_id from the user's first project (or query based on the storage path)
    // For now, we'll query the user's projects to get a project_id
    const pool = getPool()
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE developer_id = $1 LIMIT 1',
      [auth.id]
    )

    if (projectResult.rows.length === 0) {
      const errorResponse = authenticationError('No project found for this user').toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const project_id = projectResult.rows[0].id

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
    const scopedPath = buildStoragePath(project_id, storage_path)

    // Validate the path belongs to this project
    try {
      validateStoragePath(scopedPath, project_id)
    } catch (error: any) {
      if (error.message === StorageScopeError.CROSS_PROJECT_PATH) {
        const errorResponse = permissionDeniedError(
          'Access to other project files not permitted',
          project_id
        ).toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }
      const errorResponse = validationError('Invalid storage path', {
        path: scopedPath,
        error: error.message,
      }).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Implement actual file download using the storage service
    const { downloadFileFromStorage, fileExistsInStorage } = await import('@/lib/storage')

    // Check if file exists
    const exists = await fileExistsInStorage(scopedPath)
    if (!exists) {
      const errorResponse = notFoundError('File not found', project_id).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    // Download file from storage
    const downloadResult = await downloadFileFromStorage(scopedPath, {
      track: true, // Track the download for analytics
    })

    const responseData = {
      success: true,
      message: 'File downloaded successfully',
      file: {
        path: downloadResult.storagePath,
        name: downloadResult.fileName,
        size: downloadResult.fileSize,
        type: downloadResult.contentType,
        downloaded_at: new Date().toISOString(),
        // Base64 encode the file content for JSON response
        data: downloadResult.data.toString('base64'),
      },
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
    const downloadedBytes = downloadResult.fileSize
    try {
      trackStorageDownload(project_id, downloadedBytes)
    } catch (err) {
      console.error(`[Storage API] [${correlationId}] Failed to track download usage:`, err)
    }

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
    const auth = await authenticateRequest(req) as AuthenticatedEntity

    // Get project_id - for JWT auth it's in the token, for API key auth we query the database
    let project_id: string
    if ('project_id' in auth && (auth as JwtPayload).project_id) {
      // JWT authentication
      project_id = (auth as JwtPayload).project_id
    } else {
      // API key authentication - query database for user's project
      const pool = getPool()
      const projectResult = await pool.query(
        'SELECT id FROM projects WHERE developer_id = $1 LIMIT 1',
        [auth.id]
      )
      if (projectResult.rows.length === 0) {
        const errorResponse = authenticationError('No project found for this user').toNextResponse()
        return setCorrelationHeader(errorResponse, correlationId)
      }
      project_id = projectResult.rows[0].id
    }

    const responseData = {
      success: true,
      message: 'Storage download endpoint',
      project_id: project_id,
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

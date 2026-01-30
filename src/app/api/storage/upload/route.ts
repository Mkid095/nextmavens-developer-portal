/**
 * POST /api/storage/upload
 *
 * Upload a file to storage with project-scoped paths.
 * All file paths are prefixed with project_id to ensure isolation.
 *
 * US-004: Prefix Storage Paths (prd-resource-isolation.json)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, JwtPayload } from '@/lib/middleware'
import { checkFeature } from '@/lib/features'
import {
  validateStoragePath,
  buildStoragePath,
  StorageScopeError,
} from '@/lib/middleware/storage-scope'

export async function POST(req: NextRequest) {
  try {
    // Check if storage is enabled
    const storageEnabled = await checkFeature('storage_enabled')
    if (!storageEnabled) {
      return NextResponse.json(
        {
          error: 'Storage disabled',
          message: 'File storage is temporarily disabled. Downloads are still available. Please try again later.',
        },
        { status: 503 }
      )
    }

    const auth = await authenticateRequest(req) as JwtPayload

    // Parse the request body
    const body = await req.json()
    const { file_name, file_size, content_type, storage_path } = body

    // Validation
    if (!file_name || file_size === undefined || !content_type) {
      return NextResponse.json(
        { error: 'file_name, file_size, and content_type are required' },
        { status: 400 }
      )
    }

    // Check file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file_size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size of 100MB' },
        { status: 400 }
      )
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
        return NextResponse.json(
          {
            error: 'Cross-project path access denied',
            message: 'Access to other project files not permitted',
            code: StorageScopeError.CROSS_PROJECT_PATH,
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        {
          error: 'Invalid storage path',
          message: error.message,
          code: error.message,
        },
        { status: 400 }
      )
    }

    // TODO: Implement actual file upload to Telegram storage service
    // For now, return a placeholder response with the scoped path
    return NextResponse.json(
      {
        success: true,
        message: 'File upload endpoint ready for integration with Telegram storage service',
        file: {
          name: file_name,
          size: file_size,
          type: content_type,
          path: scopedPath,
          uploaded_at: new Date().toISOString(),
        },
        note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Storage API] Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
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
    return NextResponse.json(
      {
        success: true,
        message: 'File listing endpoint ready for integration with Telegram storage service',
        project_id: auth.project_id,
        path_format: 'project_id:/path',
        example_paths: examplePaths,
        files: [],
        note: 'This is a placeholder. The actual storage service integration will be implemented separately.',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Storage API] List error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/storage/upload
 *
 * Upload a file to storage.
 * This endpoint checks the storage_enabled flag before allowing uploads.
 * Downloads (GET requests) are not affected by this flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { checkFeature } from '@/lib/features'

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

    const developer = await authenticateRequest(req)

    // Parse the request body
    const body = await req.json()
    const { file_name, file_size, content_type } = body

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

    // TODO: Implement actual file upload to Telegram storage service
    // For now, return a placeholder response
    return NextResponse.json(
      {
        success: true,
        message: 'File upload endpoint ready for integration with Telegram storage service',
        file: {
          name: file_name,
          size: file_size,
          type: content_type,
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
 * This endpoint demonstrates that downloads are not affected by the storage flag.
 * In a real implementation, this would list files or provide download URLs.
 */
export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req)

    // Note: Downloads are NOT blocked by storage_enabled flag
    // This implements the read-only mode requirement

    // TODO: Implement actual file listing from Telegram storage service
    return NextResponse.json(
      {
        success: true,
        message: 'File listing endpoint ready for integration with Telegram storage service',
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

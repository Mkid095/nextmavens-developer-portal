/**
 * Storage Scope Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import type { JwtPayload } from '@/lib/auth'
import { StorageScopeError } from './constants'
import { validateStoragePath, validateStoragePathFormat } from './path'

export function handleFileUpload(
  req: NextRequest,
  path: string,
  auth: JwtPayload
): NextResponse {
  try {
    validateStoragePath(path, auth.project_id)

    const parsed = validateStoragePathFormat(path)

    return NextResponse.json({
      status: 'ready',
      path: path,
      storage_path: parsed.storagePath,
      project_id: auth.project_id,
    })
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

    if (error.message === StorageScopeError.MISSING_PROJECT_ID) {
      return NextResponse.json(
        {
          error: 'Missing project ID',
          message: 'Project ID is required for file operations',
          code: StorageScopeError.MISSING_PROJECT_ID,
        },
        { status: 401 }
      )
    }

    if (error.message === StorageScopeError.PATH_TRAVERSAL_DETECTED) {
      return NextResponse.json(
        {
          error: 'Path traversal detected',
          message: 'Invalid file path detected',
          code: StorageScopeError.PATH_TRAVERSAL_DETECTED,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Invalid storage path',
        message: error.message || 'Path validation failed',
        code: error.message || StorageScopeError.INVALID_PATH_FORMAT,
      },
      { status: 400 }
    )
  }
}

export function handleFileDownload(
  req: NextRequest,
  path: string,
  auth: JwtPayload
): NextResponse {
  return handleFileUpload(req, path, auth)
}

/**
 * Storage Upload Route - Module - Main Route
 *
 * @deprecated This file has been refactored into the upload-route-module.
 * Please import from './upload-route-module' instead.
 */

import { NextRequest } from 'next/server'
import { handleUpload, handleList } from './handlers'

/**
 * POST /api/storage/upload
 *
 * Upload a file to storage with project-scoped paths.
 */
export async function POST(req: NextRequest) {
  return handleUpload(req)
}

/**
 * GET /api/storage/upload
 *
 * List files or demonstrate storage path format.
 */
export async function GET(req: NextRequest) {
  return handleList(req)
}

/**
 * Storage Upload Route - Module - Utility: File Handlers
 */

import { NextRequest } from 'next/server'
import type { FileBufferResult } from '../types'
import { ERROR_MESSAGES } from '../constants'
import { validationError } from '@/lib/errors'

export async function getFileBuffer(
  req: NextRequest,
  body: { file_size: number; file_content?: string },
  correlationId: string
): Promise<{ success: true; data: FileBufferResult } | { success: false; response: Response }> {
  const contentTypeHeader = req.headers.get('content-type')

  if (contentTypeHeader?.startsWith('multipart/form-data')) {
    return await handleMultipartUpload(req, body.file_size, correlationId)
  } else {
    return await handleBase64Upload(body, correlationId)
  }
}

async function handleMultipartUpload(
  req: NextRequest,
  fileSize: number,
  correlationId: string
): Promise<{ success: true; data: FileBufferResult } | { success: false; response: Response }> {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    const errorResponse = validationError(ERROR_MESSAGES.NO_FILE_PROVIDED, {
      expected: 'multipart/form-data with "file" field',
    }).toNextResponse()
    return { success: false, response: errorResponse }
  }

  // Validate file size matches
  if (file.size !== fileSize) {
    const errorResponse = validationError(ERROR_MESSAGES.SIZE_MISMATCH, {
      provided_size: fileSize,
      actual_size: file.size,
    }).toNextResponse()
    return { success: false, response: errorResponse }
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return { success: true, data: { buffer, size: file.size } }
}

async function handleBase64Upload(
  body: { file_size: number; file_content?: string },
  correlationId: string
): Promise<{ success: true; data: FileBufferResult } | { success: false; response: Response }> {
  const { file_content, file_size } = body

  if (!file_content || typeof file_content !== 'string') {
    const errorResponse = validationError(ERROR_MESSAGES.INVALID_FILE_CONTENT, {
      format: 'base64 encoded file content',
    }).toNextResponse()
    return { success: false, response: errorResponse }
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(file_content, 'base64')
  } catch {
    const errorResponse = validationError(ERROR_MESSAGES.INVALID_ENCODING, {
      format: 'base64',
    }).toNextResponse()
    return { success: false, response: errorResponse }
  }

  // Validate decoded size matches
  if (buffer.length !== file_size) {
    const errorResponse = validationError(ERROR_MESSAGES.SIZE_MISMATCH, {
      provided_size: file_size,
      actual_decoded_size: buffer.length,
    }).toNextResponse()
    return { success: false, response: errorResponse }
  }

  return { success: true, data: { buffer, size: buffer.length } }
}

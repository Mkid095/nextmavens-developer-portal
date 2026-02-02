/**
 * Storage Upload Route - Module - List Handler
 */

import { NextRequest } from 'next/server'
import { authenticateRequest, type AuthenticatedEntity } from '@/lib/middleware'
import { JwtPayload } from '@/lib/auth'
import {
  withCorrelationId,
  setCorrelationHeader,
} from '@/lib/middleware/correlation'
import { authenticationError, internalError } from '@/lib/errors'
import { buildStoragePath } from '@/lib/middleware/storage-scope'
import { getProjectId, buildListResponse } from '../utils'
import { ERROR_MESSAGES } from '../constants'

export async function handleList(req: NextRequest) {
  const correlationId = withCorrelationId(req)

  try {
    const auth = await authenticateRequest(req) as AuthenticatedEntity
    const project_id = await getProjectId(auth)

    // Generate example paths for this project
    const examplePaths = [
      buildStoragePath(project_id, '/uploads/image.png'),
      buildStoragePath(project_id, '/documents/report.pdf'),
      buildStoragePath(project_id, '/assets/logo.svg'),
    ]

    const response = buildListResponse(project_id, examplePaths)
    return setCorrelationHeader(response, correlationId)
  } catch (error: unknown) {
    console.error(`[Storage API] [${correlationId}] List error:`, error)

    if (error instanceof Error && (error.message === 'No token provided' || error.message === 'Invalid token')) {
      const errorResponse = authenticationError(ERROR_MESSAGES.AUTH_REQUIRED).toNextResponse()
      return setCorrelationHeader(errorResponse, correlationId)
    }

    const errorResponse = internalError(ERROR_MESSAGES.LIST_FAILED).toNextResponse()
    return setCorrelationHeader(errorResponse, correlationId)
  }
}

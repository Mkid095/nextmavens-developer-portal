import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Current API version
const API_VERSION = '1.0.0'

/**
 * API versioning middleware
 *
 * Adds X-API-Version header to all API responses.
 * This helps clients track which version of the API they're using.
 *
 * When new versions are released, deprecation warnings can be added
 * via X-API-Deprecation and X-Sunset headers.
 */
export function addApiVersionHeaders(response: NextResponse): NextResponse {
  // Add API version header
  response.headers.set('X-API-Version', API_VERSION)

  // Example of how deprecation warnings would work for future versions:
  // if (isDeprecatedVersion) {
  //   response.headers.set('X-API-Deprecation', 'This version is deprecated. Please migrate to v2 by 2025-06-01.')
  //   response.headers.set('X-Sunset', '2025-06-01')
  // }

  return response
}

/**
 * Wrapper for NextResponse that adds API versioning headers
 */
export function apiVersionedJson(data: any, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init)
  return addApiVersionHeaders(response)
}

/**
 * Get current API version
 */
export function getApiVersion(): string {
  return API_VERSION
}

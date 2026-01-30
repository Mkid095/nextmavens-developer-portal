/**
 * Snapshot Error Classes
 *
 * Custom error types for snapshot operations.
 * All errors are fail-closed - data plane services MUST deny requests when snapshot fails.
 */

/**
 * Base snapshot error
 */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SnapshotError'
  }
}

/**
 * Control plane unavailable error (503)
 */
export class ControlPlaneUnavailableError extends SnapshotError {
  constructor(message?: string) {
    super(message || 'Control plane service unavailable')
    this.name = 'ControlPlaneUnavailableError'
  }
}

/**
 * Database connection error (503)
 */
export class DatabaseConnectionError extends SnapshotError {
  constructor(message?: string) {
    super(message || 'Failed to connect to database')
    this.name = 'DatabaseConnectionError'
  }
}

/**
 * Snapshot build error (503)
 */
export class SnapshotBuildError extends SnapshotError {
  constructor(message?: string, public cause?: Error) {
    super(message || 'Failed to build snapshot')
    this.name = 'SnapshotBuildError'
  }
}

/**
 * Project not found error (404)
 */
export class ProjectNotFoundError extends SnapshotError {
  constructor(public projectId: string) {
    super(`Project not found: ${projectId}`)
    this.name = 'ProjectNotFoundError'
  }
}

/**
 * Convert snapshot error to HTTP response
 */
export function errorToHttpResponse(error: unknown): {
  status: number
  message: string
  retryAfter: number
} {
  if (error instanceof ProjectNotFoundError) {
    return {
      status: 404,
      message: error.message,
      retryAfter: 0,
    }
  }

  // All other errors return 503 with retry-after
  const retryAfter = 30 // 30 seconds
  if (error instanceof DatabaseConnectionError) {
    return {
      status: 503,
      message: 'Database connection failed',
      retryAfter,
    }
  }

  if (error instanceof ControlPlaneUnavailableError) {
    return {
      status: 503,
      message: 'Control plane unavailable',
      retryAfter,
    }
  }

  if (error instanceof SnapshotBuildError) {
    return {
      status: 503,
      message: error.message,
      retryAfter,
    }
  }

  // Unknown errors
  return {
    status: 503,
    message: 'Internal snapshot error',
    retryAfter,
  }
}

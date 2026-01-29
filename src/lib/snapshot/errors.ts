/**
 * Snapshot API Errors
 *
 * Defines error types for fail-closed behavior in the snapshot endpoint.
 * When the control plane is unavailable, data plane services MUST deny all requests.
 */

/**
 * Base error class for snapshot errors
 */
export class SnapshotError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
    public readonly retryAfterSeconds?: number
  ) {
    super(message)
    this.name = 'SnapshotError'
  }
}

/**
 * Control plane unavailable error
 * Returned when the control plane database or critical services are down
 */
export class ControlPlaneUnavailableError extends SnapshotError {
  constructor(reason: string = 'Control plane unavailable') {
    super(
      `${reason}. Data plane services must deny all requests until control plane is restored.`,
      true, // retryable
      30 // retry after 30 seconds
    )
    this.name = 'ControlPlaneUnavailableError'
  }
}

/**
 * Database connection error
 */
export class DatabaseConnectionError extends ControlPlaneUnavailableError {
  constructor(originalError?: Error) {
    super(`Control plane database connection failed${originalError ? ': ' + originalError.message : ''}`)
    this.name = 'DatabaseConnectionError'
  }
}

/**
 * Snapshot build error
 * Returned when snapshot generation fails due to data corruption or system issues
 */
export class SnapshotBuildError extends SnapshotError {
  constructor(reason: string, originalError?: Error) {
    super(
      `Failed to build snapshot: ${reason}${originalError ? ' - ' + originalError.message : ''}`,
      true,
      60 // retry after 60 seconds
    )
    this.name = 'SnapshotBuildError'
  }
}

/**
 * Project not found error
 * This is NOT a fail-closed error - project may not exist
 */
export class ProjectNotFoundError extends SnapshotError {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`, false) // not retryable
    this.name = 'ProjectNotFoundError'
  }
}

/**
 * Quota service unavailable error
 */
export class QuotaServiceUnavailableError extends ControlPlaneUnavailableError {
  constructor(originalError?: Error) {
    super(`Quota service unavailable${originalError ? ': ' + originalError.message : ''}`)
    this.name = 'QuotaServiceUnavailableError'
  }
}

/**
 * Convert any error to appropriate HTTP status code and response
 */
export function errorToHttpResponse(error: unknown): {
  status: number
  message: string
  retryAfter?: number
} {
  if (error instanceof ControlPlaneUnavailableError) {
    return {
      status: 503,
      message: error.message,
      retryAfter: error.retryAfterSeconds,
    }
  }

  if (error instanceof DatabaseConnectionError) {
    return {
      status: 503,
      message: error.message,
      retryAfter: error.retryAfterSeconds,
    }
  }

  if (error instanceof QuotaServiceUnavailableError) {
    return {
      status: 503,
      message: error.message,
      retryAfter: error.retryAfterSeconds,
    }
  }

  if (error instanceof SnapshotBuildError) {
    return {
      status: 503,
      message: error.message,
      retryAfter: error.retryAfterSeconds,
    }
  }

  if (error instanceof ProjectNotFoundError) {
    return {
      status: 404,
      message: error.message,
    }
  }

  // Unknown error - fail closed
  console.error('[Snapshot Error] Unknown error type:', error)
  return {
    status: 503,
    message: 'Control plane temporarily unavailable. Please retry later.',
    retryAfter: 30,
  }
}

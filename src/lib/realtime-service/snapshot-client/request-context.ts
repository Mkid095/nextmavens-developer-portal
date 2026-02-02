/**
 * Request Context Management
 * Handles correlation ID tracking for request tracing
 * US-006: Add Correlation ID to Realtime Service
 */

/**
 * Request context for tracking correlation ID per connection
 * US-006: Correlation ID tracking
 */
interface RequestContext {
  correlationId?: string
}

/**
 * Current request context (tracked per WebSocket connection)
 * US-006: Correlation ID tracking
 */
let currentRequestContext: RequestContext = {}

/**
 * Set the correlation ID for the current request context
 * US-006: Correlation ID tracking
 * @param correlationId - The correlation ID to set
 */
export function setRequestCorrelationId(correlationId: string): void {
  currentRequestContext.correlationId = correlationId
}

/**
 * Get the correlation ID from the current request context
 * US-006: Correlation ID tracking
 * @returns The correlation ID or undefined
 */
export function getRequestCorrelationId(): string | undefined {
  return currentRequestContext.correlationId
}

/**
 * Clear the current request context
 * US-006: Correlation ID tracking
 */
export function clearRequestContext(): void {
  currentRequestContext = {}
}

/**
 * Format a log message with correlation ID
 * US-006: Correlation ID tracking
 * @param message - The message to format
 * @returns Formatted message with correlation ID if available
 */
export function formatLogMessage(message: string): string {
  const correlationId = getRequestCorrelationId()
  if (correlationId) {
    return `[Realtime Service Snapshot] [correlation_id: ${correlationId}] ${message}`
  }
  return `[Realtime Service Snapshot] ${message}`
}

/**
 * API Gateway Rate Limit Tracker
 * Sliding window rate limit tracker
 */

/**
 * Sliding window rate limit tracker
 * Key: project_id, Value: array of request timestamps
 */
const rateLimitTracker = new Map<string, number[]>()

/**
 * Clean up old requests from rate limit tracker
 * @param projectId - Project ID
 * @param windowMs - Time window in milliseconds
 */
export function cleanupRateLimitTracker(projectId: string, windowMs: number): void {
  const now = Date.now()
  const requests = rateLimitTracker.get(projectId) || []
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

  if (validRequests.length > 0) {
    rateLimitTracker.set(projectId, validRequests)
  } else {
    rateLimitTracker.delete(projectId)
  }
}

/**
 * Get current request count for a project within time window
 * @param projectId - Project ID
 * @param windowMs - Time window in milliseconds
 * @returns Current request count
 */
export function getRequestCount(projectId: string, windowMs: number): number {
  cleanupRateLimitTracker(projectId, windowMs)
  return (rateLimitTracker.get(projectId) || []).length
}

/**
 * Record a request for a project
 * @param projectId - Project ID
 * @param timestamp - Request timestamp
 */
export function recordRequest(projectId: string, timestamp: number): void {
  const requests = rateLimitTracker.get(projectId) || []
  requests.push(timestamp)
  rateLimitTracker.set(projectId, requests)
}

/**
 * Clear rate limit tracker for a project
 * @param projectId - Project ID
 */
export function clearRateLimitTracker(projectId: string): void {
  rateLimitTracker.delete(projectId)
}

/**
 * Clear all rate limit trackers
 */
export function clearAllRateLimitTrackers(): void {
  rateLimitTracker.clear()
}

/**
 * Get rate limit tracking entries count
 * @returns Number of tracked projects
 */
export function getRateLimitTrackingEntries(): number {
  return rateLimitTracker.size
}

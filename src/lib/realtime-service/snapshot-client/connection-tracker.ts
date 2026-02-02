/**
 * Realtime Service Connection Tracker
 * Tracks active WebSocket connections per project
 */

/**
 * Active connections tracker per project
 * Key: project_id, Value: number of active connections
 */
const activeConnections = new Map<string, number>()

/**
 * Get current active connection count for a project
 * @param projectId - Project ID
 * @returns Current connection count
 */
export function getActiveConnectionCount(projectId: string): number {
  return activeConnections.get(projectId) || 0
}

/**
 * Increment active connection count for a project
 * Called when a new WebSocket connection is established
 * @param projectId - Project ID
 * @param formatLog - Optional log formatter
 * @returns New connection count
 */
export function incrementConnectionCount(projectId: string, formatLog?: (msg: string) => string): number {
  const current = activeConnections.get(projectId) || 0
  const newCount = current + 1
  activeConnections.set(projectId, newCount)
  if (formatLog) {
    console.log(formatLog(`Connection count for project ${projectId}: ${newCount}`))
  }
  return newCount
}

/**
 * Decrement active connection count for a project
 * Called when a WebSocket connection is closed
 * @param projectId - Project ID
 * @param formatLog - Optional log formatter
 * @returns New connection count
 */
export function decrementConnectionCount(projectId: string, formatLog?: (msg: string) => string): number {
  const current = activeConnections.get(projectId) || 0
  const newCount = Math.max(0, current - 1)
  activeConnections.set(projectId, newCount)
  if (formatLog) {
    console.log(formatLog(`Connection count for project ${projectId}: ${newCount}`))
  }
  return newCount
}

/**
 * Reset connection count for a project
 * Call this when you need to reset tracking (e.g., after service restart)
 * @param projectId - Project ID
 * @param formatLog - Optional log formatter
 */
export function resetConnectionCount(projectId: string, formatLog?: (msg: string) => string): void {
  activeConnections.delete(projectId)
  if (formatLog) {
    console.log(formatLog(`Reset connection count for project ${projectId}`))
  }
}

/**
 * Clear all connection counts
 * @param formatLog - Optional log formatter
 */
export function clearAllConnectionCounts(formatLog?: (msg: string) => string): void {
  activeConnections.clear()
  if (formatLog) {
    console.log(formatLog('Cleared all connection counts'))
  }
}

/**
 * Get all active connections
 * @returns Array of active connection entries
 */
export function getActiveConnections(): Array<{ projectId: string; count: number }> {
  return Array.from(activeConnections.entries()).map(([projectId, count]) => ({
    projectId,
    count,
  }))
}

/**
 * Get connection tracking entries count
 * @returns Number of tracked projects
 */
export function getConnectionTrackingEntries(): number {
  return activeConnections.size
}

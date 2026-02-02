/**
 * Break Glass Page Utilities
 * Utility functions for break glass console
 */

/**
 * Format seconds into human-readable time string
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "1h 23m 45s" or "05:30")
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

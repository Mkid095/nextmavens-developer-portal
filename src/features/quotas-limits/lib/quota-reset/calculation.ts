/**
 * Quota Reset Calculations
 *
 * Provides date calculation utilities for quota reset operations.
 * US-008: Implement Quota Reset
 */

/**
 * Calculate the next month's reset date
 * Keeps the same day of month, or last day of next month if current day is last day
 */
export function getNextMonthResetDate(currentReset: Date): Date {
  const nextReset = new Date(currentReset)

  // Move to next month
  nextReset.setMonth(nextReset.getMonth() + 1)

  // If the current day was the last day of the month, ensure we stay on last day
  const currentResetCopy = new Date(currentReset)
  const isLastDayOfMonth = currentResetCopy.getMonth() !== new Date(currentResetCopy.getFullYear(), currentResetCopy.getMonth() + 1, 0).getDate()

  if (isLastDayOfMonth) {
    // Set to last day of next month
    const lastDayOfNextMonth = new Date(nextReset.getFullYear(), nextReset.getMonth() + 1, 0)
    nextReset.setDate(lastDayOfNextMonth.getDate())
  }

  return nextReset
}

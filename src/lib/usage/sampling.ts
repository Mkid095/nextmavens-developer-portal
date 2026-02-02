/**
 * Usage Sampling Module
 *
 * Implements usage sampling to reduce tracking overhead in production.
 * In production, only a percentage of usage events are tracked, and the
 * results are extrapolated to estimate total usage.
 *
 * US-009 from prd-usage-tracking.json
 */

/**
 * Get the sample rate for the current environment
 *
 * @returns Sample rate between 0 and 1 (e.g., 0.1 = 10% sampling)
 */
export function getSampleRate(): number {
  const env = (process.env.NODE_ENV || 'development') as string

  switch (env) {
    case 'production':
      // Prod: 10% sampling as per acceptance criteria
      return 0.1
    case 'staging':
      // Staging: 50% sampling
      return 0.5
    case 'development':
    case 'test':
    default:
      // Dev: 100% tracking as per acceptance criteria
      return 1.0
  }
}

/**
 * Get sample rate from environment variable (allows runtime override)
 *
 * @returns Sample rate from env var or default
 */
export function getConfiguredSampleRate(): number {
  const envSampleRate = process.env.USAGE_SAMPLE_RATE

  if (envSampleRate) {
    const rate = parseFloat(envSampleRate)
    if (!isNaN(rate) && rate >= 0 && rate <= 1) {
      return rate
    }
  }

  return getSampleRate()
}

/**
 * Determine if a usage event should be tracked based on sampling rate
 *
 * @returns true if the event should be tracked, false otherwise
 */
export function shouldTrackUsage(): boolean {
  const sampleRate = getConfiguredSampleRate()

  // Always track if sample rate is 100%
  if (sampleRate >= 1) {
    return true
  }

  // Never track if sample rate is 0%
  if (sampleRate <= 0) {
    return false
  }

  // Random sampling
  return Math.random() < sampleRate
}

/**
 * Calculate the extrapolation multiplier for sampled data
 *
 * When sampling is used, tracked quantities need to be multiplied
 * by this factor to estimate the actual usage.
 *
 * @returns Multiplier to extrapolate from sample to total
 */
export function getExtrapolationMultiplier(): number {
  const sampleRate = getConfiguredSampleRate()

  if (sampleRate <= 0) {
    return 0
  }

  return 1 / sampleRate
}

/**
 * Adjust a quantity value based on sampling
 *
 * When recording a metric with sampling enabled, we can either:
 * 1. Skip recording entirely (for random sampling)
 * 2. Record the full quantity and let aggregation extrapolate
 * 3. Record an adjusted quantity that accounts for the sampling rate
 *
 * This function returns the adjusted quantity to record.
 * For example, with 10% sampling, we multiply by 10 to extrapolate.
 *
 * @param quantity - The actual quantity to record
 * @returns Adjusted quantity for extrapolation
 */
export function adjustQuantityForSampling(quantity: number): number {
  const multiplier = getExtrapolationMultiplier()

  if (multiplier <= 0) {
    return 0
  }

  return Math.round(quantity * multiplier)
}

/**
 * Check if sampling is enabled (rate < 100%)
 *
 * @returns true if sampling is enabled, false if tracking all events
 */
export function isSamplingEnabled(): boolean {
  return getConfiguredSampleRate() < 1.0
}

/**
 * Get sampling information for debugging/monitoring
 *
 * @returns Object with current sampling configuration
 */
export function getSamplingInfo(): {
  environment: string
  sampleRate: number
  extrapolationMultiplier: number
  samplingEnabled: boolean
} {
  const env = process.env.NODE_ENV || 'development'
  const sampleRate = getConfiguredSampleRate()

  return {
    environment: env,
    sampleRate,
    extrapolationMultiplier: getExtrapolationMultiplier(),
    samplingEnabled: isSamplingEnabled(),
  }
}

/**
 * Wrapper function to conditionally track usage with sampling
 *
 * This function should be used instead of directly calling tracking
 * functions when sampling is desired.
 *
 * @param trackerFn - The tracking function to call if sampling allows
 * @param args - Arguments to pass to the tracking function
 *
 * @example
 * // Usage with a tracking function
 * trackWithSampling(trackRealtimeMessage, projectId)
 *
 * // Usage with tracking function and args
 * trackWithSampling(
 *   recordStorageMetric,
 *   { projectId, metricType: 'storage_upload', quantity: 1024 }
 * )
 */
export async function trackWithSampling<T extends (...args: any[]) => any>(
  trackerFn: T,
  ...args: Parameters<T>
): Promise<void> {
  if (shouldTrackUsage()) {
    try {
      await trackerFn(...args)
    } catch (error) {
      // Log but don't throw - tracking should be silent
      console.error('[Usage Sampling] Tracking error:', error)
    }
  }
}

/**
 * Wrapper function to track with extrapolation
 *
 * This function always tracks but adjusts the quantity to account
 * for sampling rate. Useful when you want to track every request
 * but with reduced data volume.
 *
 * @param trackerFn - The tracking function that accepts a metric object
 * @param metric - The metric object with quantity to adjust
 * @param quantityKey - The key name for the quantity field (default: 'quantity')
 *
 * @example
 * trackWithExtrapolation(
 *   recordStorageMetric,
 *   { projectId, metricType: 'storage_upload', quantity: 1024 }
 * )
 */
export async function trackWithExtrapolation<
  T extends (...args: any[]) => any,
  M extends Record<string, any>
>(
  trackerFn: T,
  metric: M,
  quantityKey: keyof M = 'quantity' as keyof M
): Promise<void> {
  try {
    // Create a copy of the metric with adjusted quantity
    const adjustedMetric = { ...metric }
    const originalQuantity = adjustedMetric[quantityKey] as number

    if (typeof originalQuantity === 'number') {
      adjustedMetric[quantityKey] = adjustQuantityForSampling(
        originalQuantity
      ) as M[keyof M]
    }

    await trackerFn(adjustedMetric)
  } catch (error) {
    console.error('[Usage Sampling] Tracking with extrapolation error:', error)
  }
}

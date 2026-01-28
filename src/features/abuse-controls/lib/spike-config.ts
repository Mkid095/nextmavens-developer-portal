import { SpikeAction, SpikeDetectionConfig } from '../types'

/**
 * Spike Detection Configuration
 *
 * Provides default configuration and validation for usage spike detection.
 */

/**
 * Default spike detection configuration
 */
export const DEFAULT_SPIKE_DETECTION_CONFIG: SpikeDetectionConfig = {
  // Detect when usage is 3x the average
  thresholdMultiplier: 3.0,
  // Check for spikes within a 1 hour window
  windowDurationMs: 60 * 60 * 1000, // 1 hour
  // Calculate average over the last 24 hours
  baselinePeriodMs: 24 * 60 * 60 * 1000, // 24 hours
  // Only check projects with at least 10 usage events
  minUsageThreshold: 10,
  // By default, just warn without suspending
  action: SpikeAction.WARNING,
  // Spike detection is enabled by default
  enabled: true,
}

/**
 * Aggressive spike detection configuration
 * Triggers suspension for severe spikes
 */
export const AGGRESSIVE_SPIKE_DETECTION_CONFIG: SpikeDetectionConfig = {
  thresholdMultiplier: 5.0,
  windowDurationMs: 30 * 60 * 1000, // 30 minutes
  baselinePeriodMs: 12 * 60 * 60 * 1000, // 12 hours
  minUsageThreshold: 5,
  action: SpikeAction.SUSPEND,
  enabled: true,
}

/**
 * Conservative spike detection configuration
 * Only warns, never suspends automatically
 */
export const CONSERVATIVE_SPIKE_DETECTION_CONFIG: SpikeDetectionConfig = {
  thresholdMultiplier: 5.0,
  windowDurationMs: 60 * 60 * 1000, // 1 hour
  baselinePeriodMs: 48 * 60 * 60 * 1000, // 48 hours
  minUsageThreshold: 20,
  action: SpikeAction.WARNING,
  enabled: true,
}

/**
 * Configuration validation errors
 */
export interface ConfigValidationError {
  field: string
  message: string
  value: unknown
}

/**
 * Validate spike detection configuration
 *
 * @param config - Configuration to validate
 * @returns Object with isValid flag and array of errors (if any)
 */
export function validateSpikeDetectionConfig(
  config: Partial<SpikeDetectionConfig>
): { isValid: boolean; errors: ConfigValidationError[] } {
  const errors: ConfigValidationError[] = []

  // Validate threshold multiplier
  if (config.thresholdMultiplier !== undefined) {
    if (typeof config.thresholdMultiplier !== 'number') {
      errors.push({
        field: 'thresholdMultiplier',
        message: 'Must be a number',
        value: config.thresholdMultiplier,
      })
    } else if (config.thresholdMultiplier < 1.0) {
      errors.push({
        field: 'thresholdMultiplier',
        message: 'Must be at least 1.0',
        value: config.thresholdMultiplier,
      })
    } else if (config.thresholdMultiplier > 100.0) {
      errors.push({
        field: 'thresholdMultiplier',
        message: 'Must not exceed 100.0',
        value: config.thresholdMultiplier,
      })
    }
  }

  // Validate window duration
  if (config.windowDurationMs !== undefined) {
    if (typeof config.windowDurationMs !== 'number') {
      errors.push({
        field: 'windowDurationMs',
        message: 'Must be a number',
        value: config.windowDurationMs,
      })
    } else if (config.windowDurationMs < 60 * 1000) {
      // Minimum 1 minute
      errors.push({
        field: 'windowDurationMs',
        message: 'Must be at least 1 minute (60000ms)',
        value: config.windowDurationMs,
      })
    } else if (config.windowDurationMs > 24 * 60 * 60 * 1000) {
      // Maximum 24 hours
      errors.push({
        field: 'windowDurationMs',
        message: 'Must not exceed 24 hours (86400000ms)',
        value: config.windowDurationMs,
      })
    }
  }

  // Validate baseline period
  if (config.baselinePeriodMs !== undefined) {
    if (typeof config.baselinePeriodMs !== 'number') {
      errors.push({
        field: 'baselinePeriodMs',
        message: 'Must be a number',
        value: config.baselinePeriodMs,
      })
    } else if (config.baselinePeriodMs < 60 * 60 * 1000) {
      // Minimum 1 hour
      errors.push({
        field: 'baselinePeriodMs',
        message: 'Must be at least 1 hour (3600000ms)',
        value: config.baselinePeriodMs,
      })
    } else if (config.baselinePeriodMs > 30 * 24 * 60 * 60 * 1000) {
      // Maximum 30 days
      errors.push({
        field: 'baselinePeriodMs',
        message: 'Must not exceed 30 days (2592000000ms)',
        value: config.baselinePeriodMs,
      })
    }
  }

  // Validate baseline period is greater than window duration
  if (
    config.baselinePeriodMs !== undefined &&
    config.windowDurationMs !== undefined &&
    config.baselinePeriodMs <= config.windowDurationMs
  ) {
    errors.push({
      field: 'baselinePeriodMs',
      message: 'Must be greater than windowDurationMs',
      value: config.baselinePeriodMs,
    })
  }

  // Validate minimum usage threshold
  if (config.minUsageThreshold !== undefined) {
    if (typeof config.minUsageThreshold !== 'number') {
      errors.push({
        field: 'minUsageThreshold',
        message: 'Must be a number',
        value: config.minUsageThreshold,
      })
    } else if (config.minUsageThreshold < 0) {
      errors.push({
        field: 'minUsageThreshold',
        message: 'Must be non-negative',
        value: config.minUsageThreshold,
      })
    } else if (!Number.isInteger(config.minUsageThreshold)) {
      errors.push({
        field: 'minUsageThreshold',
        message: 'Must be an integer',
        value: config.minUsageThreshold,
      })
    }
  }

  // Validate action type
  if (config.action !== undefined) {
    const validActions = [SpikeAction.WARNING, SpikeAction.SUSPEND, SpikeAction.NONE]
    if (!validActions.includes(config.action)) {
      errors.push({
        field: 'action',
        message: `Must be one of: ${validActions.join(', ')}`,
        value: config.action,
      })
    }
  }

  // Validate enabled flag
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    errors.push({
      field: 'enabled',
      message: 'Must be a boolean',
      value: config.enabled,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get a complete spike detection config by merging with defaults
 *
 * @param config - Partial configuration to merge with defaults
 * @returns Complete configuration object
 */
export function getSpikeDetectionConfig(
  config: Partial<SpikeDetectionConfig> = {}
): SpikeDetectionConfig {
  return {
    ...DEFAULT_SPIKE_DETECTION_CONFIG,
    ...config,
  }
}

/**
 * Check if a configuration is safe to use
 *
 * @param config - Configuration to check
 * @returns true if the configuration is valid and safe
 */
export function isSafeConfig(config: Partial<SpikeDetectionConfig>): boolean {
  // Don't allow auto-suspension with very low thresholds
  if (
    config.action === SpikeAction.SUSPEND &&
    config.thresholdMultiplier !== undefined &&
    config.thresholdMultiplier < 2.0
  ) {
    return false
  }

  // Validate the configuration
  const validation = validateSpikeDetectionConfig(config)
  return validation.isValid
}

/**
 * Get human-readable description of a configuration
 *
 * @param config - Configuration to describe
 * @returns Human-readable description
 */
export function describeConfiguration(config: SpikeDetectionConfig): string {
  const windowMinutes = Math.round(config.windowDurationMs / (60 * 1000))
  const baselineHours = Math.round(config.baselinePeriodMs / (60 * 60 * 1000))

  return `Detect usage spikes of ${config.thresholdMultiplier}x average within a ${windowMinutes}-minute window (based on ${baselineHours}-hour baseline). ${
    config.action === SpikeAction.SUSPEND
      ? 'Automatically suspend on detection.'
      : config.action === SpikeAction.WARNING
      ? 'Log warnings only.'
      : 'No action taken.'
  } Enabled: ${config.enabled}`
}

/**
 * Preset configurations for different scenarios
 */
export const SPIKE_CONFIG_PRESETS: Record<string, SpikeDetectionConfig> = {
  default: DEFAULT_SPIKE_DETECTION_CONFIG,
  aggressive: AGGRESSIVE_SPIKE_DETECTION_CONFIG,
  conservative: CONSERVATIVE_SPIKE_DETECTION_CONFIG,
}

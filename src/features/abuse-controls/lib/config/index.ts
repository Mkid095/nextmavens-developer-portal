/**
 * Abuse Control Configuration
 * Re-exports all configuration modules
 */

// Hard Cap Configuration
export {
  DEFAULT_QUOTA_CONFIGS,
  HARD_CAP_DISPLAY_NAMES,
  HARD_CAP_DESCRIPTIONS,
  MIN_HARD_CAPS,
  MAX_HARD_CAPS,
  validateCapValue,
  getCapValidationError,
} from './hard-cap-config'

// Spike Detection Configuration
export {
  SPIKE_THRESHOLD,
  SPIKE_DETECTION_WINDOW_MS,
  SPIKE_BASELINE_PERIOD_MS,
  MIN_USAGE_FOR_SPIKE_DETECTION,
  DEFAULT_SPIKE_ACTION_THRESHOLDS,
  DEFAULT_SPIKE_SEVERITY_THRESHOLDS,
  determineSpikeSeverity,
} from './spike-detection-config'

// Error Rate Configuration
export {
  ERROR_RATE_THRESHOLD,
  ERROR_RATE_DETECTION_WINDOW_MS,
  MIN_REQUESTS_FOR_ERROR_RATE_DETECTION,
  DEFAULT_ERROR_RATE_ACTION_THRESHOLDS,
  DEFAULT_ERROR_RATE_SEVERITY_THRESHOLDS,
  determineErrorRateSeverity,
} from './error-rate-config'

// Pattern Detection Configuration
export {
  SQL_INJECTION_DETECTION_ENABLED,
  SQL_INJECTION_MIN_OCCURRENCES,
  SQL_INJECTION_DETECTION_WINDOW_MS,
  SQL_INJECTION_SUSPEND_ON_DETECTION,
  AUTH_BRUTE_FORCE_DETECTION_ENABLED,
  AUTH_BRUTE_FORCE_MIN_FAILED_ATTEMPTS,
  AUTH_BRUTE_FORCE_DETECTION_WINDOW_MS,
  AUTH_BRUTE_FORCE_SUSPEND_ON_DETECTION,
  RAPID_KEY_CREATION_DETECTION_ENABLED,
  RAPID_KEY_CREATION_MIN_KEYS,
  RAPID_KEY_CREATION_DETECTION_WINDOW_MS,
  RAPID_KEY_CREATION_SUSPEND_ON_DETECTION,
  SQL_INJECTION_PATTERNS,
  DEFAULT_PATTERN_DETECTION_CONFIG,
  DEFAULT_PATTERN_ACTION_THRESHOLDS,
  determinePatternAction,
} from './pattern-detection-config'

// Notification Configuration
export {
  SUPPORT_EMAIL,
  SUPPORT_URL,
  EMAIL_CONFIG,
  validateEmailConfig,
  getDefaultSuspensionNotificationTemplate,
} from './notification-config'

// Re-export types
export type { SpikeAction, SpikeActionThreshold, SpikeSeverityThreshold } from './spike-detection-config'
export type { ErrorRateActionThreshold, ErrorRateSeverityThreshold } from './error-rate-config'
export type { PatternActionThreshold } from './pattern-detection-config'
export type { SuspensionNotificationTemplate } from './notification-config'

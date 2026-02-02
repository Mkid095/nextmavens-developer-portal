/**
 * Override Suspension Service
 *
 * @deprecated Import from @/features/break-glass/lib/override-suspension instead
 */

export {
  overrideSuspension,
  getOverrideHistory,
  validateOverrideRequest,
} from './override-suspension'

export type {
  HardCapUpdate,
  OverrideSuspensionParams,
  ValidationResult,
  ValidationError,
} from './override-suspension'

/**
 * Manual Overrides Validation Module
 *
 * Provides validation functions for manual override requests.
 * Ensures all override requests meet business rules and constraints.
 */

import {
  ManualOverrideAction,
  ManualOverrideRequest,
  HardCapType,
} from '../../types'

/**
 * Validate manual override request
 *
 * @param request - The override request to validate
 * @returns Validation result with success flag and error message if invalid
 */
export async function validateManualOverrideRequest(
  request: ManualOverrideRequest
): Promise<{ valid: boolean; error?: string }> {
  // Validate reason is provided
  if (!request.reason || request.reason.trim().length === 0) {
    return {
      valid: false,
      error: 'Reason is required for manual override',
    }
  }

  if (request.reason.length > 1000) {
    return {
      valid: false,
      error: 'Reason cannot exceed 1000 characters',
    }
  }

  // Validate action type
  if (
    ![
      ManualOverrideAction.UNSUSPEND,
      ManualOverrideAction.INCREASE_CAPS,
      ManualOverrideAction.BOTH,
    ].includes(request.action)
  ) {
    return {
      valid: false,
      error: 'Invalid action type. Must be unsuspend, increase_caps, or both',
    }
  }

  // Validate new caps if provided
  if (
    request.action === ManualOverrideAction.INCREASE_CAPS ||
    request.action === ManualOverrideAction.BOTH
  ) {
    if (!request.newCaps || Object.keys(request.newCaps).length === 0) {
      return {
        valid: false,
        error: 'newCaps must be provided when action is increase_caps or both',
      }
    }

    // Validate each cap value
    for (const [capType, value] of Object.entries(request.newCaps)) {
      if (!Object.values(HardCapType).includes(capType as HardCapType)) {
        return {
          valid: false,
          error: `Invalid cap type: ${capType}`,
        }
      }

      if (typeof value !== 'number' || value < 0 || value > 1_000_000) {
        return {
          valid: false,
          error: `Invalid value for ${capType}: must be between 0 and 1,000,000`,
        }
      }
    }
  }

  return { valid: true }
}

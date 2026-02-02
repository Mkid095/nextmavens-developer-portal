/**
 * Custom error types for the abuse controls data layer
 */

import type { HardCapType, SuspensionReason } from '../../types'

/**
 * Custom error for quota violations
 */
export class QuotaExceededError extends Error {
  constructor(
    public readonly capType: HardCapType,
    public readonly projectId: string
  ) {
    super(`Quota exceeded for ${capType} on project ${projectId}`)
    this.name = 'QuotaExceededError'
  }
}

/**
 * Custom error for suspended projects
 */
export class ProjectSuspendedError extends Error {
  constructor(
    public readonly projectId: string,
    public readonly capExceeded: HardCapType,
    public readonly reason: SuspensionReason
  ) {
    super(
      `Project ${projectId} is suspended due to exceeding ${capExceeded} limit. ${reason.details || ''}`
    )
    this.name = 'ProjectSuspendedError'
  }
}

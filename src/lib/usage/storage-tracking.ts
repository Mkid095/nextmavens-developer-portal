/**
 * Storage Usage Tracking Service
 *
 * Tracks storage usage metrics for quota enforcement and billing.
 * All tracking is done asynchronously (fire-and-forget) to avoid blocking requests.
 *
 * US-004 from prd-usage-tracking.json
 *
 * @deprecated This file has been refactored into the storage-tracking-module.
 * Please import from './storage-tracking-module' instead.
 */

export * from './storage-tracking-module'

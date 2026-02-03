/**
 * POST /api/storage/upload
 *
 * Upload a file to storage with project-scoped paths.
 *
 * US-004: Prefix Storage Paths (prd-resource-isolation.json)
 * US-009: Update Storage Service Errors (Standardized Error Format)
 * US-004: Track Storage Usage (prd-usage-tracking.json)
 * US-007: Emit Events on Actions (prd-webhooks-events.json)
 * US-007: Add Correlation ID to Storage Service (prd-observability.json)
 *
 * @deprecated This file has been refactored into the upload-route-module.
 * Please import from '../upload-route-module' instead.
 */

export { POST, GET } from '../upload-route-module/route'

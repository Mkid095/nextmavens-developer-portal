/**
 * Deletion Preview Modal - Utility Functions
 */

import type { DeletionPreviewData } from './types'

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate total count of resources to be deleted
 */
export function getTotalCount(preview: DeletionPreviewData | null): number {
  if (!preview) return 0
  const { will_be_deleted } = preview
  return (
    will_be_deleted.schemas +
    will_be_deleted.tables +
    Object.values(will_be_deleted.api_keys).reduce((a, b) => a + b, 0) +
    will_be_deleted.webhooks +
    will_be_deleted.edge_functions +
    will_be_deleted.storage_buckets +
    will_be_deleted.secrets
  )
}

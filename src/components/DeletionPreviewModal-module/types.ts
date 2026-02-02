/**
 * Deletion Preview Modal - Type Definitions
 */

export interface DeletionPreviewData {
  project: {
    id: string
    name: string
    slug: string
    status: string
    created_at: string
  }
  will_be_deleted: {
    schemas: number
    tables: number
    api_keys: Record<string, number>
    webhooks: number
    edge_functions: number
    storage_buckets: number
    secrets: number
  }
  dependencies: Array<{
    type: string
    target: string
    impact: string
  }>
  recoverable_until: string | null
}

export interface DeletionPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onConfirmDelete: () => Promise<void>
}

/**
 * Create Secret Modal - Type Definitions
 *
 * PRD: US-010 from prd-secrets-versioning.json
 */

import type { CreateSecretRequest } from '@/lib/types/secrets.types'

export interface CreateSecretModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateSecretRequest) => Promise<void>
  projectId: string
}

export interface FormState {
  name: string
  value: string
  showValue: boolean
  submitting: boolean
  error: string
  createdSecret: { name: string; value: string } | null
}

export interface ValidationResult {
  valid: boolean
  error: string | null
}

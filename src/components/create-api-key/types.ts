// Types for CreateApiKeyModal

import type { ApiKeyType, ApiKeyEnvironment, ApiKeyScope } from '@/lib/types/api-key.types'

export interface CreateApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateKey: (data: CreateKeyData) => Promise<void>
  projectId?: string
}

export interface CreateKeyData {
  name: string
  key_type: ApiKeyType
  environment: ApiKeyEnvironment
  scopes?: ApiKeyScope[]
  mcpAccessLevel?: 'ro' | 'rw' | 'admin'
}

export interface KeyTypeOption {
  type: ApiKeyType
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  warning: string
  defaultScopes: ApiKeyScope[]
  useCases: string[]
}

export interface CreatedKeyDisplay {
  apiKey: {
    id: string
    name: string
    public_key: string
    key_type: string
    key_prefix: string
  }
  secretKey?: string
}

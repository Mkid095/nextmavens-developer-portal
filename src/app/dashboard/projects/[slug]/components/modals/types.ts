/**
 * Create API Key Modal Types
 */

import type { KeyType, McpAccessLevel } from '../../types'

export interface CreateApiKeyModalProps {
  isOpen: boolean
  isSubmitting: boolean
  keyError: string
  onClose: () => void
  onSubmit: (data: {
    name: string
    keyType: KeyType
    environment: 'live' | 'test' | 'dev'
    scopes: string[]
    mcpAccessLevel: McpAccessLevel
  }) => Promise<void>
}

export interface CreateApiKeyFormData {
  name: string
  keyType: KeyType
  environment: 'live' | 'test' | 'dev'
  scopes: string[]
  mcpAccessLevel: McpAccessLevel
}

export type FormSetter = React.Dispatch<React.SetStateAction<any>>

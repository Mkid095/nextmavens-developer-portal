/**
 * SQL Editor Types
 */

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer' | null

export interface SqlEditorProps {
  value?: string
  onChange?: (value: string) => void
  onExecute?: (query: string, readonly: boolean, explain?: boolean) => void
  onLoadQuery?: (query: string) => void
  readOnly?: boolean
  placeholder?: string
  height?: string
  minHeight?: string
  userRole?: UserRole
}

export const DESTRUCTIVE_COMMANDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
  'TRUNCATE', 'CREATE', 'REPLACE', 'RENAME', 'GRANT', 'REVOKE', 'COMMENT'
] as const

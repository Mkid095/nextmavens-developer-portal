/**
 * SQL Editor Module
 */

// Component
export { SqlEditor } from './SqlEditor/SqlEditor'

// Types
export type { SqlEditorProps, UserRole } from './types'
export { DESTRUCTIVE_COMMANDS } from './types'

// Utilities
export { extractSqlCommand, isDestructiveQuery } from './utils'

// Permissions
export { canDisableReadonly, isQueryTypeAllowed } from './permissions'

/**
 * Schema Browser Components Index
 * Re-exports all schema browser components and utilities
 */

// Main component
export { SchemaBrowser } from './SchemaBrowser'

// Sub-components
export { TableNode } from './TableNode'
export { SearchBar } from './SearchBar'
export { TableHeader } from './TableHeader'
export { EmptyState } from './EmptyState'

// Hooks
export { useSchemaBrowserData } from './hooks'

// Types
export type {
  DatabaseColumn,
  DatabaseIndex,
  DatabaseForeignKey,
  DatabaseTable,
  SchemaData,
  SchemaBrowserProps,
} from './types'

// Utils
export { getDataTypeColor, getDataTypeIcon } from './utils'

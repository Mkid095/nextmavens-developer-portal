/**
 * Schema Browser Types
 * Type definitions for the Schema Browser component
 */

export interface DatabaseColumn {
  name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
}

export interface DatabaseIndex {
  index_name: string
  index_def: string
  is_unique: boolean
  is_primary: boolean
}

export interface DatabaseForeignKey {
  constraint_name: string
  column_name: string
  foreign_table: string
  foreign_column: string
}

export interface DatabaseTable {
  name: string
  columns?: DatabaseColumn[]
  indexes?: DatabaseIndex[]
  foreign_keys?: DatabaseForeignKey[]
  row_count?: number
}

export interface SchemaData {
  tables: DatabaseTable[]
}

interface SchemaBrowserProps {
  projectId: string
  schemaData: SchemaData | null
  loading?: boolean
  onTableSelect?: (tableName: string) => void
  selectedTable?: string | null
}

export type { SchemaBrowserProps }

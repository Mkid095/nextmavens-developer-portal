/**
 * Visual Schema Diagram Types
 */

export interface DatabaseColumn {
  name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
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
  foreign_keys?: DatabaseForeignKey[]
  row_count?: number
}

export interface SchemaData {
  tables: DatabaseTable[]
}

export interface VisualSchemaDiagramProps {
  projectId: string
  schemaData: SchemaData | null
  loading?: boolean
}

export interface TableBox {
  name: string
  x: number
  y: number
  width: number
  height: number
  columns: DatabaseColumn[]
  foreignKeys: DatabaseForeignKey[]
}

export interface CanvasState {
  scale: number
  offsetX: number
  offsetY: number
}

export interface DragOffset {
  x: number
  y: number
}

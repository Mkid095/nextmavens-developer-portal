/**
 * Schema Browser Feature
 *
 * Visual schema exploration component for database structure.
 *
 * US-001: Create Schema Browser Component
 * US-011: Visual Schema Diagram
 */

export {
  SchemaBrowser,
  type DatabaseColumn,
  type DatabaseTable,
  type SchemaData,
} from './components/SchemaBrowser'

export {
  VisualSchemaDiagram,
  type DatabaseColumn as VisualDatabaseColumn,
  type DatabaseForeignKey,
  type DatabaseTable as VisualDatabaseTable,
  type SchemaData as VisualSchemaData,
} from './components/VisualSchemaDiagram'

/**
 * Studio Page Types
 * Type definitions for the studio interface
 */

export interface DatabaseTable {
  name: string
  type: string
}

/**
 * User role in the organization for RBAC permissions
 */
export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer' | null

export interface StudioState {
  tables: DatabaseTable[]
  selectedTable: string | null
  tableData: any
  loading: boolean
  activeNav: string
  searchQuery: string
  selectedUserId: string | null
  usersKey: number
  sqlQuery: string
  queryResults: any
  queryError: string | null
  isExecuting: boolean
  showQueryHistory: boolean
  showSavedQueries: boolean
  userRole: UserRole
  organizationId: string | null
  permissionsLoading: boolean
}

export interface NavItem {
  id: string
  label: string
  icon: React.ElementType
}

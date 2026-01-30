'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Table,
  Plus,
  Search,
  ChevronRight,
  Database,
  Settings,
  Code2,
  Shield,
  HardDrive,
  Activity,
  Users,
  Terminal,
  AlertCircle,
} from 'lucide-react'
import { TablesView, type TableData } from '@/features/studio/components/TablesView'
import { UserList } from '@/features/auth-users/components/UserList'
import { UserDetail } from '@/features/auth-users/components/UserDetail'
import { SqlEditor } from '@/features/sql-editor'
import { ResultsTable } from '@/features/sql-editor/components/ResultsTable'
import { QueryHistoryPanel, addQueryToHistory } from '@/features/sql-editor/components/QueryHistory'
import { Permission } from '@/lib/types/rbac.types'

interface DatabaseTable {
  name: string
  type: string
}

/**
 * User role in the organization for RBAC permissions
 */
type UserRole = 'owner' | 'admin' | 'developer' | 'viewer' | null

const navItems = [
  { id: 'tables', label: 'Tables', icon: Table },
  { id: 'sql', label: 'SQL Query', icon: Terminal },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'api-keys', label: 'API Keys', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('tables')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [usersKey, setUsersKey] = useState(0)

  // US-005: SQL Query state
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResults, setQueryResults] = useState<any>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // US-004: Query History state
  const [showQueryHistory, setShowQueryHistory] = useState(true)

  // US-011: RBAC state for SQL execution permissions
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  useEffect(() => {
    fetchTables()
    fetchUserPermissions()
  }, [params.slug])

  /**
   * US-011: Fetch user role and organization ID for RBAC permissions
   * Viewers can only SELECT, Developers can SELECT/INSERT/UPDATE,
   * Admins/Owners have full access
   */
  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('accessToken')

      // Get project info to find organization ID
      const projectRes = await fetch(`/api/projects?slug=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!projectRes.ok) {
        return
      }

      const projectData = await projectRes.json()
      const project = projectData.projects?.[0]

      if (!project) {
        return
      }

      // Get organization ID from project
      setOrganizationId(project.tenant_id || null)

      // Fetch user's database.write permission to determine role
      if (project.tenant_id) {
        const permRes = await fetch(
          `/api/permissions/check?permission=${encodeURIComponent(Permission.DATABASE_WRITE)}&organizationId=${encodeURIComponent(project.tenant_id)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (permRes.ok) {
          const permData = await permRes.json()
          setUserRole(permData.role || null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch user permissions:', err)
    } finally {
      setPermissionsLoading(false)
    }
  }

  /**
   * US-011: Check if user can execute a specific query based on their role
   * - Viewers: only SELECT
   * - Developers: SELECT, INSERT, UPDATE
   * - Admins/Owners: full access (SELECT, INSERT, UPDATE, DELETE, DDL)
   */
  const canExecuteQuery = (query: string, readonly: boolean): boolean => {
    // If readonly mode is on, only SELECT queries are allowed (for all authenticated users)
    if (readonly) {
      const trimmedQuery = query.trim()
      const command = extractSqlCommand(trimmedQuery)
      return command === 'SELECT'
    }

    // If readonly mode is OFF, check role-based permissions
    if (!userRole) {
      return false // No role = no permission
    }

    const trimmedQuery = query.trim()
    const command = extractSqlCommand(trimmedQuery)

    // Viewers can only SELECT even when readonly is off
    if (userRole === 'viewer') {
      return command === 'SELECT'
    }

    // Developers can SELECT, INSERT, UPDATE (but not DELETE or DDL)
    if (userRole === 'developer') {
      return ['SELECT', 'INSERT', 'UPDATE'].includes(command)
    }

    // Admins and Owners have full access
    if (userRole === 'admin' || userRole === 'owner') {
      return true
    }

    return false
  }

  /**
   * Extract the first SQL command from a query
   */
  const extractSqlCommand = (queryText: string): string => {
    const trimmed = queryText.trim()
    const withoutComments = trimmed
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    const match = withoutComments.match(/^(\w+)/)
    return match ? match[1].toUpperCase() : ''
  }

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }, [selectedTable, params.slug])

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/database/tables?project=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setTables(data.tables || [])
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTableData = async (tableName: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/database/table/${params.slug}/${tableName}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTableData(data)
      }
    } catch (err) {
      console.error('Failed to fetch table data:', err)
    }
  }

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
  }

  const handleBackToUsers = () => {
    setSelectedUserId(null)
  }

  const handleUserUpdated = () => {
    // Trigger a refresh of the user list
    setUsersKey(prev => prev + 1)
  }

  /**
   * US-004: Handle selecting a query from history
   */
  const handleSelectQueryFromHistory = (query: string, readonly: boolean) => {
    setSqlQuery(query)
    setQueryError(null)
  }

  /**
   * US-005: Execute SQL query with readonly mode
   * US-011: Enforce RBAC permissions for SQL execution
   * - Viewers can only SELECT
   * - Developers can SELECT/INSERT/UPDATE
   * - Admins/Owners have full access
   * US-004: Add query to history after successful execution
   * US-008: Support explain mode for query plan analysis
   */
  const handleExecuteQuery = async (query: string, readonly: boolean, explain?: boolean) => {
    // US-011: Check if user can execute this query based on their role
    if (!canExecuteQuery(query, readonly)) {
      const command = extractSqlCommand(query.trim())
      const permissionMessage =
        userRole === 'viewer'
          ? `Viewers can only execute SELECT queries. Your current role '${userRole}' does not permit ${command} operations.`
          : userRole === 'developer'
            ? `Developers can execute SELECT, INSERT, and UPDATE queries. Your current role '${userRole}' does not permit ${command} operations.`
            : `You do not have permission to execute this query. Your role '${userRole || 'unknown'}' does not permit ${command} operations.`

      setQueryError(permissionMessage)
      return
    }

    setIsExecuting(true)
    setQueryError(null)
    setQueryResults(null)

    try {
      const token = localStorage.getItem('accessToken')
      // First, get the project ID from the slug
      const projectRes = await fetch(`/api/projects?slug=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!projectRes.ok) {
        throw new Error('Failed to get project info')
      }

      const projectData = await projectRes.json()
      const projectId = projectData.projects?.[0]?.id

      if (!projectId) {
        throw new Error('Project not found')
      }

      // US-008: Execute query with readonly and explain parameters
      const res = await fetch(`/api/studio/${projectId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, readonly, explain }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle validation errors for readonly mode
        if (data.error) {
          setQueryError(data.error)
        } else {
          setQueryError('Query execution failed')
        }
        return
      }

      if (data.success) {
        setQueryResults(data.data)
        // US-004: Add successful query to history
        addQueryToHistory(query, readonly)
      }
    } catch (err: any) {
      console.error('Query execution failed:', err)
      setQueryError(err.message || 'Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-900">Studio</span>
              <p className="text-xs text-slate-500">{params.slug}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                activeNav === item.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Tables List */}
        {activeNav === 'tables' && (
          <div className="border-t border-slate-200">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
            <div className="px-3 pb-3 max-h-64 overflow-y-auto">
              {filteredTables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                    selectedTable === table.name
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Table className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{table.name}</span>
                </button>
              ))}
              {filteredTables.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No tables found</p>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/projects/${params.slug}`} className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {activeNav === 'users' ? 'Users' :
                   activeNav === 'sql' ? 'SQL Query' :
                   selectedTable || 'Select a table'}
                </h1>
                {tableData && activeNav === 'tables' && (
                  <p className="text-sm text-slate-500">
                    {tableData.total} rows • {tableData.columns.length} columns
                  </p>
                )}
                {activeNav === 'users' && !selectedUserId && (
                  <p className="text-sm text-slate-500">
                    Manage application users
                  </p>
                )}
                {activeNav === 'users' && selectedUserId && (
                  <p className="text-sm text-slate-500">
                    User details
                  </p>
                )}
                {activeNav === 'sql' && (
                  <p className="text-sm text-slate-500">
                    Execute SQL queries on your database
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeNav === 'tables' && (
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">New Row</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeNav === 'sql' ? (
            <div className="flex gap-6 h-full">
              {/* Main SQL Editor Section */}
              <div className={`flex flex-col gap-6 ${showQueryHistory ? 'flex-1' : 'w-full'}`}>
                {/* US-011: Permission banner showing user's role and allowed operations */}
                {!permissionsLoading && (
                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                    userRole === 'viewer'
                      ? 'bg-blue-50 border-blue-200'
                      : userRole === 'developer'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      userRole === 'viewer'
                        ? 'text-blue-600'
                        : userRole === 'developer'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        SQL Query Permissions
                      </p>
                      <p className="text-xs text-slate-700 mt-1">
                        Your role: <strong className="capitalize">{userRole || 'unknown'}</strong>
                        {userRole === 'viewer' && (
                          <span> • You can only execute <strong>SELECT</strong> queries</span>
                        )}
                        {userRole === 'developer' && (
                          <span> • You can execute <strong>SELECT, INSERT, UPDATE</strong> queries</span>
                        )}
                        {(userRole === 'admin' || userRole === 'owner') && (
                          <span> • You have <strong>full access</strong> to all SQL operations</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* US-005: SQL Editor with read-only mode */}
                <SqlEditor
                  value={sqlQuery}
                  onChange={setSqlQuery}
                  onExecute={handleExecuteQuery}
                  userRole={userRole}
                  height="300px"
                />

                {/* Error display */}
                {queryError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900">Query Error</p>
                    <p className="text-sm text-red-700 mt-1">{queryError}</p>
                  </div>
                )}

                {/* Loading indicator */}
                {isExecuting && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-sm text-slate-600">Executing query...</span>
                  </div>
                )}

                {/* Query results */}
                {queryResults && !isExecuting && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-900">
                        Query Results
                      </h3>
                      <span className="text-xs text-slate-500">
                        {queryResults.rowCount} row{queryResults.rowCount !== 1 ? 's' : ''} • {queryResults.executionTime}ms
                      </span>
                    </div>
                    <ResultsTable
                      columns={queryResults.columns || []}
                      rows={queryResults.rows || []}
                      rowCount={queryResults.rowCount || 0}
                    />
                  </div>
                )}
              </div>

              {/* US-004: Query History Panel */}
              {showQueryHistory && (
                <div className="w-80 flex-shrink-0">
                  <QueryHistoryPanel
                    onSelectQuery={handleSelectQueryFromHistory}
                  />
                </div>
              )}
            </div>
          ) : activeNav === 'users' ? (
            selectedUserId ? (
              <UserDetail
                key={selectedUserId}
                userId={selectedUserId}
                onBack={handleBackToUsers}
                onUserUpdated={handleUserUpdated}
              />
            ) : (
              <UserList
                key={usersKey}
                onViewUser={handleViewUser}
              />
            )
          ) : (
            <TablesView
              selectedTable={selectedTable}
              tableData={tableData}
              loading={loading}
            />
          )}
        </div>
      </main>
    </div>
  )
}

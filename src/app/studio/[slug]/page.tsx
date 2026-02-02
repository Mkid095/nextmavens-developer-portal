'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import { TablesView } from '@/features/studio/components/TablesView'
import { UserList } from '@/features/auth-users/components/UserList'
import { UserDetail } from '@/features/auth-users/components/UserDetail'
import { useStudioData } from './hooks/useStudioData'
import { useStudioPermissions } from './hooks/useStudioPermissions'
import { useStudioQuery } from './hooks/useStudioQuery'
import { StudioSidebar, StudioHeader, SqlQueryView } from './components'

export default function StudioPage() {
  const params = useParams()
  const projectSlug = params.slug as string

  // State
  const [activeNav, setActiveNav] = useState('tables')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [usersKey, setUsersKey] = useState(0)
  const [showQueryHistory, setShowQueryHistory] = useState(true)
  const [showSavedQueries, setShowSavedQueries] = useState(false)

  // Hooks
  const studioData = useStudioData(projectSlug)
  const { userRole, permissionsLoading, canExecuteQuery, getPermissionError } =
    useStudioPermissions(projectSlug)
  const queryHook = useStudioQuery(projectSlug, canExecuteQuery, getPermissionError)

  // Handlers
  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
  }

  const handleBackToUsers = () => {
    setSelectedUserId(null)
  }

  const handleUserUpdated = () => {
    setUsersKey((prev) => prev + 1)
  }

  const handleSelectQueryFromHistory = (query: string, readonly: boolean) => {
    queryHook.setSqlQuery(query)
    queryHook.setQueryError(null)
  }

  const handleSelectSavedQuery = (query: string) => {
    queryHook.setSqlQuery(query)
    queryHook.setQueryError(null)
  }

  const filteredTables = studioData.filteredTables(searchQuery)

  return (
    <div className="min-h-screen bg-[#F3F5F7] flex">
      <StudioSidebar
        activeNav={activeNav}
        projectSlug={projectSlug}
        searchQuery={searchQuery}
        onNavChange={setActiveNav}
        onSearchChange={setSearchQuery}
        selectedTable={studioData.selectedTable}
        tables={studioData.tables}
        onTableSelect={studioData.setSelectedTable}
        filteredTables={filteredTables}
      />

      <main className="flex-1 flex flex-col">
        <StudioHeader
          activeNav={activeNav}
          projectSlug={projectSlug}
          selectedTable={studioData.selectedTable}
          tableData={studioData.tableData}
          selectedUserId={selectedUserId}
        />

        <div className="flex-1 overflow-auto p-6">
          {activeNav === 'sql' ? (
            <SqlQueryView
              sqlQuery={queryHook.sqlQuery}
              onSqlQueryChange={queryHook.setSqlQuery}
              queryResults={queryHook.queryResults}
              queryError={queryHook.queryError}
              isExecuting={queryHook.isExecuting}
              onExecuteQuery={queryHook.handleExecuteQuery}
              userRole={userRole}
              permissionsLoading={permissionsLoading}
              showQueryHistory={showQueryHistory}
              showSavedQueries={showSavedQueries}
              onShowQueryHistory={() => {
                setShowQueryHistory(true)
                setShowSavedQueries(false)
              }}
              onShowSavedQueries={() => {
                setShowQueryHistory(false)
                setShowSavedQueries(true)
              }}
              onSelectQueryFromHistory={handleSelectQueryFromHistory}
              onSelectSavedQuery={handleSelectSavedQuery}
            />
          ) : activeNav === 'users' ? (
            selectedUserId ? (
              <UserDetail
                key={selectedUserId}
                userId={selectedUserId}
                onBack={handleBackToUsers}
                onUserUpdated={handleUserUpdated}
              />
            ) : (
              <UserList key={usersKey} onViewUser={handleViewUser} />
            )
          ) : (
            <TablesView
              selectedTable={studioData.selectedTable}
              tableData={studioData.tableData}
              loading={studioData.loading}
            />
          )}
        </div>
      </main>
    </div>
  )
}

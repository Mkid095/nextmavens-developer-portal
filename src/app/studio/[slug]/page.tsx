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
} from 'lucide-react'
import { TablesView, type TableData } from '@/features/studio/components/TablesView'
import { UsersList, type User } from '@/features/studio/components/UsersList'

interface DatabaseTable {
  name: string
  type: string
}

const navItems = [
  { id: 'tables', label: 'Tables', icon: Table },
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
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [params.slug])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }, [selectedTable, params.slug])

  useEffect(() => {
    if (activeNav === 'users') {
      fetchUsers()
    }
  }, [activeNav, params.slug])

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

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/auth/users?project=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                  {activeNav === 'users' ? 'Users' : selectedTable || 'Select a table'}
                </h1>
                {tableData && activeNav === 'tables' && (
                  <p className="text-sm text-slate-500">
                    {tableData.total} rows • {tableData.columns.length} columns
                  </p>
                )}
                {activeNav === 'users' && (
                  <p className="text-sm text-slate-500">
                    {users.length} users
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Row</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeNav === 'users' ? (
            <UsersList users={users} loading={usersLoading} />
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

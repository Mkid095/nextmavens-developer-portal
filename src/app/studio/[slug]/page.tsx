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
} from 'lucide-react'

interface TableColumn {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

interface TableData {
  columns: TableColumn[]
  rows: Record<string, any>[]
  total: number
  limit: number
  offset: number
}

interface DatabaseTable {
  name: string
  type: string
}

const navItems = [
  { id: 'tables', label: 'Tables', icon: Table },
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

  useEffect(() => {
    fetchTables()
  }, [params.slug])

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
                  {selectedTable || 'Select a table'}
                </h1>
                {tableData && (
                  <p className="text-sm text-slate-500">
                    {tableData.total} rows • {tableData.columns.length} columns
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

        {/* Table Data */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !selectedTable ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Table className="w-16 h-16 text-slate-300 mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Select a table</h2>
              <p className="text-slate-600">Choose a table from the sidebar to view its data</p>
            </div>
          ) : !tableData ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 w-10">
                        <input type="checkbox" className="rounded border-slate-300" />
                      </th>
                      {tableData.columns.map((col) => (
                        <th
                          key={col.name}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <span>{col.name}</span>
                            <span className="text-slate-400 font-normal">({col.type})</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tableData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </td>
                        {tableData.columns.map((col) => (
                          <td key={col.name} className="px-4 py-3 text-sm text-slate-900">
                            {row[col.name] === null ? (
                              <span className="text-slate-400 italic">null</span>
                            ) : col.type === 'boolean' ? (
                              row[col.name] ? 'true' : 'false'
                            ) : typeof row[col.name] === 'object' ? (
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {JSON.stringify(row[col.name])}
                              </code>
                            ) : (
                              String(row[col.name])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing {tableData.offset + 1} to {Math.min(tableData.offset + tableData.limit, tableData.total)} of {tableData.total} rows
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={tableData.offset === 0}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={tableData.offset + tableData.limit >= tableData.total}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

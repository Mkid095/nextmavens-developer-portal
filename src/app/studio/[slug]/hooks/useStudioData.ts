/**
 * Studio Data Hook
 * Handles fetching tables and table data
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DatabaseTable } from '../types'

export function useStudioData(projectSlug: string) {
  const router = useRouter()
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTables()
  }, [projectSlug])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }, [selectedTable, projectSlug])

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/database/tables?project=${projectSlug}`, {
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
      const res = await fetch(`/api/database/table/${projectSlug}/${tableName}`, {
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

  const filteredTables = (searchQuery: string) =>
    tables.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return {
    tables,
    selectedTable,
    setSelectedTable,
    tableData,
    loading,
    filteredTables,
  }
}

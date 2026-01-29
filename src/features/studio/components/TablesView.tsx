'use client'

import { Table } from 'lucide-react'

export interface TableColumn {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

export interface TableRow {
  [key: string]: string | number | boolean | null | object
}

export interface TableData {
  columns: TableColumn[]
  rows: TableRow[]
  total: number
  limit: number
  offset: number
}

interface TablesViewProps {
  selectedTable: string | null
  tableData: TableData | null
  loading: boolean
}

export function TablesView({ selectedTable, tableData, loading }: TablesViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!selectedTable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Table className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Select a table</h2>
        <p className="text-slate-600">Choose a table from the sidebar to view its data</p>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 w-10">
                <input type="checkbox" className="rounded border-slate-300" />
              </th>
              {tableData.columns.map((col) => (
                <th key={col.name} className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
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
  )
}

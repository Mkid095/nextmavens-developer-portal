'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Download, RefreshCw, Eye, Edit3, Lock, TrendingUp, AlertCircle } from 'lucide-react'

/**
 * MCP token usage analytics data
 */
interface McpTokenAnalytics {
  apiKeyId: string
  keyPrefix: string
  keyName: string
  mcpAccessLevel: 'ro' | 'rw' | 'admin' | 'unknown'
  requestCount: number
  operationsPerformed: Array<{
    operation: string
    count: number
  }>
  successCount: number
  errorCount: number
  successRate: number
  errorRate: number
  averageResponseTime: number
  lastUsed: string | null
  firstUsed: string | null
  aiToolsUsed: string[]
}

interface McpUsageAnalyticsProps {
  projectId: string
}

/**
 * US-011: MCP Usage Analytics Component
 *
 * Displays MCP token usage analytics including:
 * - Request count per token
 * - Operations performed
 * - Success/error rate
 * - Export functionality
 */
export function McpUsageAnalytics({ projectId }: McpUsageAnalyticsProps) {
  const [analytics, setAnalytics] = useState<McpTokenAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/mcp/analytics?project_id=${projectId}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch MCP usage analytics')
      }

      const data = await response.json()
      setAnalytics(data.data.tokens || [])
      setTotal(data.data.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportToCsv = async () => {
    try {
      const response = await fetch(
        `/api/mcp/analytics?project_id=${projectId}&export=csv`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to export analytics')
      }

      const csv = await response.text()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mcp-usage-analytics-${projectId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Failed to export analytics:', err)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [projectId])

  const getAccessLevelIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'ro':
        return <Eye className="w-4 h-4 text-blue-600" />
      case 'rw':
        return <Edit3 className="w-4 h-4 text-amber-600" />
      case 'admin':
        return <Lock className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getAccessLevelBadgeColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'ro':
        return 'bg-blue-100 text-blue-700'
      case 'rw':
        return 'bg-amber-100 text-amber-700'
      case 'admin':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (analytics.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No MCP usage data yet</p>
        <p className="text-sm text-slate-500 mt-1">
          Usage analytics will appear once MCP tokens are used
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">MCP Token Usage</h3>
          <p className="text-sm text-slate-600 mt-1">
            {total} token{total !== 1 ? 's' : ''} with usage data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Token analytics cards */}
      <div className="space-y-4">
        {analytics.map((token) => (
          <div
            key={token.apiKeyId}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Token header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getAccessLevelIcon(token.mcpAccessLevel)}
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-slate-900">{token.keyPrefix}••••</code>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${getAccessLevelBadgeColor(
                        token.mcpAccessLevel
                      )}`}
                    >
                      {token.mcpAccessLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {token.requestCount.toLocaleString()} request
                    {token.requestCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {token.successRate.toFixed(1)}% success
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Requests</p>
                <p className="text-lg font-semibold text-slate-900">
                  {token.requestCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Success</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {token.successCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Errors</p>
                <p className="text-lg font-semibold text-red-600">
                  {token.errorCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Avg Response</p>
                <p className="text-lg font-semibold text-slate-900">
                  {token.averageResponseTime.toFixed(0)}ms
                </p>
              </div>
            </div>

            {/* Operations */}
            {token.operationsPerformed.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Operations</p>
                <div className="flex flex-wrap gap-2">
                  {token.operationsPerformed.slice(0, 5).map((op) => (
                    <span
                      key={op.operation}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                    >
                      {op.operation} ({op.count})
                    </span>
                  ))}
                  {token.operationsPerformed.length > 5 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">
                      +{token.operationsPerformed.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* AI tools */}
            {token.aiToolsUsed.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>AI Tools:</span>
                {token.aiToolsUsed.map((tool) => (
                  <span key={tool} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

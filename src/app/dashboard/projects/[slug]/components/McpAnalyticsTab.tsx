import { BarChart3 } from 'lucide-react'
import { McpUsageAnalytics } from '@/components/McpUsageAnalytics'

interface McpAnalyticsTabProps {
  projectId: string
}

export function McpAnalyticsTab({ projectId }: McpAnalyticsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">MCP Usage Analytics</h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitor usage of Model Context Protocol tokens
          </p>
        </div>
      </div>

      <McpUsageAnalytics projectId={projectId} />
    </div>
  )
}

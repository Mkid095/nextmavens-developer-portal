/**
 * SimpleBarChart Component
 *
 * A lightweight SVG bar chart for visualizing log data.
 * Shows log volume over time grouped by level or service.
 */

'use client'

import React from 'react'
import type { ChartData } from '../types'
import { CHART_COLORS } from '../constants'

interface SimpleBarChartProps {
  data: ChartData
  groupBy: 'level' | 'service'
}

export function SimpleBarChart({ data, groupBy }: SimpleBarChartProps) {
  if (!data.data || data.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No chart data available
      </div>
    )
  }

  // Group data by timestamp
  const groupedByTime: Record<string, typeof data.data> = {}
  data.data.forEach((point) => {
    const timestamp = point.timestamp.split(':')[0] + ':00:00' // Round to hour
    if (!groupedByTime[timestamp]) {
      groupedByTime[timestamp] = []
    }
    groupedByTime[timestamp].push(point)
  })

  // Get sorted timestamps
  const timestamps = Object.keys(groupedByTime).sort()
  const uniqueGroups = Array.from(
    new Set(data.data.map((d) => (groupBy === 'level' ? d.level : d.service)))
  ).filter(Boolean) as string[]

  // Calculate max count for scaling
  const maxCount = Math.max(...data.data.map((d) => d.count), 1)

  // Chart dimensions
  const chartHeight = 200
  const chartWidth = 700
  const barWidth = Math.max(10, (chartWidth - 60) / timestamps.length / uniqueGroups.length - 2)
  const groupGap = 4

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 40} className="mx-auto">
        {/* Y-axis labels and grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = chartHeight - (chartHeight * percent) / 100
          const value = Math.round((maxCount * percent) / 100)
          return (
            <g key={percent}>
              <line
                x1={40}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={percent === 0 ? '0' : '4,4'}
              />
              <text
                x={35}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontFamily="monospace"
              >
                {value}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {timestamps.map((timestamp, i) => {
          const x = 50 + i * ((barWidth + groupGap) * uniqueGroups.length + groupGap)
          const points = groupedByTime[timestamp] || []

          return (
            <g key={timestamp}>
              {uniqueGroups.map((group, j) => {
                const point = points.find(
                  (p) => (groupBy === 'level' ? p.level : p.service) === group
                )
                const count = point?.count || 0
                const barHeight = (count / maxCount) * chartHeight
                const y = chartHeight - barHeight
                const barX = x + j * (barWidth + groupGap)
                const color = CHART_COLORS[group] || '#64748b'

                return (
                  <g key={group}>
                    <rect
                      x={barX}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={color}
                      opacity="0.8"
                      rx="2"
                    />
                    {/* Tooltip */}
                    {count > 0 && (
                      <title>
                        {timestamp}\n{group}: {count} logs
                      </title>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* X-axis labels (show every few timestamps to avoid crowding) */}
        {timestamps
          .filter((_, i) => i % Math.ceil(timestamps.length / 6) === 0)
          .map((timestamp, i) => {
            const index = timestamps.indexOf(timestamp)
            const x = 50 + index * ((barWidth + groupGap) * uniqueGroups.length + groupGap)
            const date = new Date(timestamp)
            const label = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            return (
              <text
                key={timestamp}
                x={x + (barWidth * uniqueGroups.length) / 2}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {label}
              </text>
            )
          })}

        {/* Legend */}
        <g transform={`translate(${chartWidth - 150}, 10)`}>
          {uniqueGroups.map((group, i) => (
            <g key={group} transform={`translate(0, ${i * 16})`}>
              <rect width="12" height="12" fill={CHART_COLORS[group] || '#64748b'} rx="2" />
              <text x="18" y="10" fontSize="10" fill="#475569" fontWeight="500">
                {group}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

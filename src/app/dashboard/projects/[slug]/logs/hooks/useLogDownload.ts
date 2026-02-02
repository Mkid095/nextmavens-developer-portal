/**
 * useLogDownload Hook
 *
 * Handles log download functionality with validation.
 */

import { useState, useCallback } from 'react'
import type { Project, ServiceFilter, LevelFilter, DownloadFormat } from '../types'
import { getDateRange } from '../utils'

interface UseLogDownloadOptions {
  project: Project | null
  serviceFilter: ServiceFilter
  levelFilter: LevelFilter
  searchQuery: string
  dateRangeFilter: string
  customStartDate: string
  customEndDate: string
}

export function useLogDownload({
  project,
  serviceFilter,
  levelFilter,
  searchQuery,
  dateRangeFilter,
  customStartDate,
  customEndDate,
}: UseLogDownloadOptions) {
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('json')
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleDownload = useCallback(async () => {
    if (!project) return

    setDownloading(true)
    setDownloadSuccess(false)

    try {
      const token = localStorage.getItem('accessToken')

      const urlParams = new URLSearchParams()
      urlParams.append('project_id', project.id)
      urlParams.append('format', downloadFormat)

      if (serviceFilter !== 'all') urlParams.append('service', serviceFilter)
      if (levelFilter !== 'all') urlParams.append('level', levelFilter)
      if (searchQuery) urlParams.append('search', searchQuery)

      const { startDate, endDate } = getDateRange(dateRangeFilter as any, customStartDate, customEndDate)
      urlParams.append('start_date', startDate)
      urlParams.append('end_date', endDate)

      // Validate date range doesn't exceed 7 days
      const start = new Date(startDate)
      const end = new Date(endDate)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > 7) {
        alert('Date range for download cannot exceed 7 days. Please adjust your filters.')
        setDownloading(false)
        return
      }

      const res = await fetch(`/api/logs/download?${urlParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Download failed' }))
        throw new Error(errorData.error || 'Failed to download logs')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const extension = downloadFormat === 'json' ? 'json' : 'txt'
      link.download = `${project.slug}-logs-${new Date().toISOString().split('T')[0]}.${extension}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to download logs:', error)
      alert(error instanceof Error ? error.message : 'Failed to download logs. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [
    project,
    downloadFormat,
    serviceFilter,
    levelFilter,
    searchQuery,
    dateRangeFilter,
    customStartDate,
    customEndDate,
  ])

  return {
    downloadFormat,
    setDownloadFormat,
    downloading,
    downloadSuccess,
    handleDownload,
  }
}

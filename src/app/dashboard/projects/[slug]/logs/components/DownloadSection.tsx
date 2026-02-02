/**
 * DownloadSection Component
 *
 * Download format selector and download button for logs.
 */

'use client'

import React from 'react'
import { Loader2, Download, CheckCircle, FileJson, FileCode } from 'lucide-react'
import type { DownloadFormat } from '../types'

interface DownloadSectionProps {
  downloadFormat: DownloadFormat
  onDownloadFormatChange: (value: DownloadFormat) => void
  onDownload: () => void
  isDownloading: boolean
  downloadSuccess: boolean
  disabled?: boolean
}

const formatOptions: Array<{ value: DownloadFormat; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'text', label: 'Text', icon: FileCode },
]

export function DownloadSection({
  downloadFormat,
  onDownloadFormatChange,
  onDownload,
  isDownloading,
  downloadSuccess,
  disabled = false,
}: DownloadSectionProps) {
  const [showDropdown, setShowDropdown] = React.useState(false)

  const selectedFormat = formatOptions.find((f) => f.value === downloadFormat)
  const FormatIcon = selectedFormat?.icon || FileJson

  return (
    <div className="flex items-center gap-3">
      {/* Format Selector */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[140px] justify-between"
        >
          <FormatIcon className="w-4 h-4 text-slate-500" />
          <span className="text-sm uppercase">{downloadFormat}</span>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[140px]">
            {formatOptions.map((format) => {
              const Icon = format.icon
              return (
                <button
                  key={format.value}
                  onClick={() => {
                    onDownloadFormatChange(format.value)
                    setShowDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition flex items-center gap-2 ${
                    downloadFormat === format.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {format.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        disabled={disabled || isDownloading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          disabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-700 text-white hover:bg-emerald-800'
        }`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Downloading...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </>
        )}
      </button>
    </div>
  )
}

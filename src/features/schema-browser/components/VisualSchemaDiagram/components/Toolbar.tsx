/**
 * Visual Schema Diagram Components
 */

'use client'

import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

export interface ToolbarProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onAutoLayout: () => void
}

export function Toolbar({ scale, onZoomIn, onZoomOut, onResetView, onAutoLayout }: ToolbarProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
      <button
        onClick={onZoomIn}
        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4 text-slate-600" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4 text-slate-600" />
      </button>
      <button
        onClick={onResetView}
        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        title="Reset View"
      >
        <Maximize2 className="w-4 h-4 text-slate-600" />
      </button>
      <button
        onClick={onAutoLayout}
        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        title="Auto Layout"
      >
        <RotateCcw className="w-4 h-4 text-slate-600" />
      </button>
      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
}

export function InfoTip() {
  return (
    <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white/90 px-3 py-2 rounded-lg border border-slate-200">
      Drag tables to reposition • Click and drag background to pan
    </div>
  )
}

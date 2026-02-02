/**
 * Visual Schema Diagram Component
 *
 * Canvas-based schema diagram showing:
 * - Tables as draggable boxes
 * - Foreign keys as connecting lines
 * - Zoom and pan functionality
 * - Auto-layout for initial positioning
 *
 * US-011: Visual Schema Diagram
 */

'use client'

import { useEffect, useRef } from 'react'
import type { VisualSchemaDiagramProps } from './types'
import { useSchemaLayout, useCanvasInteraction, useCanvasState } from './hooks'
import { drawForeignKeyLines, drawTable, getConnectionPoint, truncateText } from './utils'
import { Toolbar, InfoTip } from './components/Toolbar'

export function VisualSchemaDiagram({
  projectId,
  schemaData,
  loading = false,
}: VisualSchemaDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { tables, setTables, calculateLayout } = useSchemaLayout(schemaData)
  const {
    draggingTable,
    setDraggingTable,
    dragOffset,
    setDragOffset,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
  } = useCanvasInteraction()
  const { canvasState, setCanvasState, zoomIn, zoomOut, resetView } = useCanvasState()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(canvasState.offsetX, canvasState.offsetY)
    ctx.scale(canvasState.scale, canvasState.scale)

    drawForeignKeyLines(ctx, tables, getConnectionPoint)

    tables.forEach((table) => {
      drawTable(ctx, table, draggingTable, truncateText)
    })

    ctx.restore()
  }, [tables, canvasState, draggingTable])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const canvasX = (mouseX - canvasState.offsetX) / canvasState.scale
    const canvasY = (mouseY - canvasState.offsetY) / canvasState.scale

    const clickedTable = tables.find(
      (table) =>
        canvasX >= table.x &&
        canvasX <= table.x + table.width &&
        canvasY >= table.y &&
        canvasY <= table.y + table.height
    )

    if (clickedTable) {
      setDraggingTable(clickedTable.name)
      setDragOffset({
        x: canvasX - clickedTable.x,
        y: canvasY - clickedTable.y,
      })
    } else {
      setIsPanning(true)
      setPanStart({ x: mouseX, y: mouseY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (draggingTable) {
      const canvasX = (mouseX - canvasState.offsetX) / canvasState.scale
      const canvasY = (mouseY - canvasState.offsetY) / canvasState.scale

      setTables((prev) =>
        prev.map((table) =>
          table.name === draggingTable
            ? { ...table, x: canvasX - dragOffset.x, y: canvasY - dragOffset.y }
            : table
        )
      )
    } else if (isPanning) {
      const dx = mouseX - panStart.x
      const dy = mouseY - panStart.y

      setCanvasState((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }))

      setPanStart({ x: mouseX, y: mouseY })
    }
  }

  const handleMouseUp = () => {
    setDraggingTable(null)
    setIsPanning(false)
  }

  const autoLayout = () => {
    if (schemaData) {
      setTables(calculateLayout(schemaData))
      resetView()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-xl border border-slate-200">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!schemaData || schemaData.tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-200">
        <p className="text-sm text-slate-600">No tables to display</p>
      </div>
    )
  }

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
      <Toolbar
        scale={canvasState.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onAutoLayout={autoLayout}
      />

      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <InfoTip />
    </div>
  )
}

export type {
  DatabaseColumn,
  DatabaseForeignKey,
  DatabaseTable,
  SchemaData,
  TableBox,
  CanvasState,
} from './types'

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

export interface DatabaseColumn {
  name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
}

export interface DatabaseForeignKey {
  constraint_name: string
  column_name: string
  foreign_table: string
  foreign_column: string
}

export interface DatabaseTable {
  name: string
  columns?: DatabaseColumn[]
  foreign_keys?: DatabaseForeignKey[]
  row_count?: number
}

export interface SchemaData {
  tables: DatabaseTable[]
}

interface VisualSchemaDiagramProps {
  projectId: string
  schemaData: SchemaData | null
  loading?: boolean
}

interface TableBox {
  name: string
  x: number
  y: number
  width: number
  height: number
  columns: DatabaseColumn[]
  foreignKeys: DatabaseForeignKey[]
}

interface CanvasState {
  scale: number
  offsetX: number
  offsetY: number
}

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
export function VisualSchemaDiagram({
  projectId,
  schemaData,
  loading = false,
}: VisualSchemaDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tables, setTables] = useState<TableBox[]>([])
  const [draggingTable, setDraggingTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offsetX: 50,
    offsetY: 50,
  })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Constants for rendering
  const TABLE_WIDTH = 200
  const COLUMN_HEIGHT = 24
  const HEADER_HEIGHT = 32
  const PADDING = 8
  const FOREIGN_KEY_LINE_WIDTH = 2
  const TABLE_SPACING = 100
  const ROW_SPACING = 100

  /**
   * Calculate auto-layout for tables using a simple grid algorithm
   */
  const calculateLayout = useCallback((schemaData: SchemaData): TableBox[] => {
    const tables: TableBox[] = []
    const tablesPerRow = Math.ceil(Math.sqrt(schemaData.tables.length))

    schemaData.tables.forEach((table, index) => {
      const row = Math.floor(index / tablesPerRow)
      const col = index % tablesPerRow

      tables.push({
        name: table.name,
        x: col * (TABLE_WIDTH + TABLE_SPACING),
        y: row * (calculateTableHeight(table) + ROW_SPACING),
        width: TABLE_WIDTH,
        height: calculateTableHeight(table),
        columns: table.columns || [],
        foreignKeys: table.foreign_keys || [],
      })
    })

    return tables
  }, [])

  /**
   * Calculate the height of a table box based on number of columns
   */
  const calculateTableHeight = (table: DatabaseTable): number => {
    const columnCount = table.columns?.length || 0
    return HEADER_HEIGHT + columnCount * COLUMN_HEIGHT + PADDING * 2
  }

  /**
   * Initialize table positions when schema data loads
   */
  useEffect(() => {
    if (schemaData && schemaData.tables.length > 0) {
      const layout = calculateLayout(schemaData)
      setTables(layout)
    }
  }, [schemaData, calculateLayout])

  /**
   * Redraw canvas whenever state changes
   */
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformation
    ctx.save()
    ctx.translate(canvasState.offsetX, canvasState.offsetY)
    ctx.scale(canvasState.scale, canvasState.scale)

    // Draw foreign key lines first (so they appear behind tables)
    drawForeignKeyLines(ctx)

    // Draw tables
    tables.forEach((table) => {
      drawTable(ctx, table)
    })

    ctx.restore()
  }, [tables, canvasState, draggingTable])

  /**
   * Draw a table box
   */
  const drawTable = (ctx: CanvasRenderingContext2D, table: TableBox) => {
    const { x, y, width, height, name, columns } = table

    // Shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Table background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, width, height)

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Table border (highlight if dragging)
    ctx.strokeStyle = draggingTable === name ? '#10b981' : '#e2e8f0'
    ctx.lineWidth = draggingTable === name ? 2 : 1
    ctx.strokeRect(x, y, width, height)

    // Header background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(x, y, width, HEADER_HEIGHT)

    // Header border
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y + HEADER_HEIGHT)
    ctx.lineTo(x + width, y + HEADER_HEIGHT)
    ctx.stroke()

    // Table name
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(truncateText(name, width - PADDING * 2), x + PADDING, y + HEADER_HEIGHT / 2)

    // Columns
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    columns.forEach((column, index) => {
      const columnY = y + HEADER_HEIGHT + PADDING + index * COLUMN_HEIGHT + COLUMN_HEIGHT / 2

      // Column name
      ctx.fillStyle = '#475569'
      ctx.textAlign = 'left'
      ctx.fillText(truncateText(column.name, width - PADDING * 3), x + PADDING, columnY)

      // Data type (right-aligned)
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'right'
      ctx.fillText(truncateText(column.data_type, 60), x + width - PADDING, columnY)
    })
  }

  /**
   * Draw foreign key relationship lines
   */
  const drawForeignKeyLines = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = FOREIGN_KEY_LINE_WIDTH

    tables.forEach((table) => {
      table.foreignKeys.forEach((fk) => {
        const targetTable = tables.find((t) => t.name === fk.foreign_table)
        if (!targetTable) return

        // Calculate connection points
        const sourcePoint = getConnectionPoint(table, fk.column_name, 'right')
        const targetPoint = getConnectionPoint(targetTable, fk.foreign_column, 'left')

        // Draw bezier curve
        ctx.beginPath()
        ctx.moveTo(sourcePoint.x, sourcePoint.y)

        const controlOffset = 50
        ctx.bezierCurveTo(
          sourcePoint.x + controlOffset, sourcePoint.y,
          targetPoint.x - controlOffset, targetPoint.y,
          targetPoint.x, targetPoint.y
        )

        ctx.stroke()

        // Draw circle at source
        ctx.fillStyle = '#6366f1'
        ctx.beginPath()
        ctx.arc(sourcePoint.x, sourcePoint.y, 3, 0, Math.PI * 2)
        ctx.fill()

        // Draw circle at target
        ctx.fillStyle = '#6366f1'
        ctx.beginPath()
        ctx.arc(targetPoint.x, targetPoint.y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    })
  }

  /**
   * Get connection point for a foreign key relationship
   */
  const getConnectionPoint = (table: TableBox, columnName: string, side: 'left' | 'right') => {
    const column = table.columns.findIndex((c) => c.name === columnName)
    const yOffset = column >= 0
      ? HEADER_HEIGHT + PADDING + column * COLUMN_HEIGHT + COLUMN_HEIGHT / 2
      : table.height / 2

    return {
      x: side === 'left' ? table.x : table.x + table.width,
      y: table.y + yOffset,
    }
  }

  /**
   * Truncate text with ellipsis if too long
   */
  const truncateText = (text: string, maxWidth: number): string => {
    // Approximate character width (will vary by font, but this is a reasonable approximation)
    const avgCharWidth = 7
    const maxChars = Math.floor(maxWidth / avgCharWidth)

    if (text.length <= maxChars) {
      return text
    }

    return text.substring(0, maxChars - 3) + '...'
  }

  /**
   * Handle mouse down - start dragging or panning
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Transform mouse coordinates to canvas space
    const canvasX = (mouseX - canvasState.offsetX) / canvasState.scale
    const canvasY = (mouseY - canvasState.offsetY) / canvasState.scale

    // Check if clicking on a table
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
      // Start panning
      setIsPanning(true)
      setPanStart({ x: mouseX, y: mouseY })
    }
  }

  /**
   * Handle mouse move - drag table or pan
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (draggingTable) {
      // Transform to canvas space
      const canvasX = (mouseX - canvasState.offsetX) / canvasState.scale
      const canvasY = (mouseY - canvasState.offsetY) / canvasState.scale

      // Update table position
      setTables((prev) =>
        prev.map((table) =>
          table.name === draggingTable
            ? {
                ...table,
                x: canvasX - dragOffset.x,
                y: canvasY - dragOffset.y,
              }
            : table
        )
      )
    } else if (isPanning) {
      // Pan the canvas
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

  /**
   * Handle mouse up - stop dragging or panning
   */
  const handleMouseUp = () => {
    setDraggingTable(null)
    setIsPanning(false)
  }

  /**
   * Zoom in
   */
  const zoomIn = () => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3),
    }))
  }

  /**
   * Zoom out
   */
  const zoomOut = () => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.3),
    }))
  }

  /**
   * Reset zoom and pan to default
   */
  const resetView = () => {
    setCanvasState({
      scale: 1,
      offsetX: 50,
      offsetY: 50,
    })
  }

  /**
   * Auto-layout tables
   */
  const autoLayout = () => {
    if (schemaData) {
      setTables(calculateLayout(schemaData))
      resetView()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-xl border border-slate-200">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No data state
  if (!schemaData || schemaData.tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-200">
        <p className="text-sm text-slate-600">No tables to display</p>
      </div>
    )
  }

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={zoomIn}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={autoLayout}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          title="Auto Layout"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
        </button>
        <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          {Math.round(canvasState.scale * 100)}%
        </div>
      </div>

      {/* Canvas */}
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

      {/* Info */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white/90 px-3 py-2 rounded-lg border border-slate-200">
        Drag tables to reposition • Click and drag background to pan
      </div>
    </div>
  )
}

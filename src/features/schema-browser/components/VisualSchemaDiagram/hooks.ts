/**
 * Visual Schema Diagram Hooks
 * Custom hooks for canvas state and interaction
 */

'use client'

import { useEffect, useCallback, useState } from 'react'
import type { SchemaData, TableBox, CanvasState, DragOffset } from './types'
import { calculateTableHeight } from './utils'

export function useSchemaLayout(schemaData: SchemaData | null) {
  const [tables, setTables] = useState<TableBox[]>([])

  const calculateLayout = useCallback((data: SchemaData): TableBox[] => {
    const result: TableBox[] = []
    const tablesPerRow = Math.ceil(Math.sqrt(data.tables.length))

    data.tables.forEach((table, index) => {
      const row = Math.floor(index / tablesPerRow)
      const col = index % tablesPerRow

      result.push({
        name: table.name,
        x: col * (200 + 100),
        y: row * (calculateTableHeight(table) + 100),
        width: 200,
        height: calculateTableHeight(table),
        columns: table.columns || [],
        foreignKeys: table.foreign_keys || [],
      })
    })

    return result
  }, [])

  useEffect(() => {
    if (schemaData && schemaData.tables.length > 0) {
      setTables(calculateLayout(schemaData))
    }
  }, [schemaData, calculateLayout])

  return { tables, setTables, calculateLayout }
}

export function useCanvasInteraction() {
  const [draggingTable, setDraggingTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  return {
    draggingTable,
    setDraggingTable,
    dragOffset,
    setDragOffset,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
  }
}

export function useCanvasState(initialScale = 1, initialOffsetX = 50, initialOffsetY = 50) {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: initialScale,
    offsetX: initialOffsetX,
    offsetY: initialOffsetY,
  })

  const zoomIn = () => {
    setCanvasState((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }))
  }

  const zoomOut = () => {
    setCanvasState((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.3) }))
  }

  const resetView = () => {
    setCanvasState({ scale: 1, offsetX: 50, offsetY: 50 })
  }

  return {
    canvasState,
    setCanvasState,
    zoomIn,
    zoomOut,
    resetView,
  }
}

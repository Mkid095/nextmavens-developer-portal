/**
 * Visual Schema Diagram Utilities
 * Drawing and layout utilities for the schema diagram
 */

import type { TableBox, DatabaseTable } from './types'

// Constants
export const TABLE_WIDTH = 200
export const COLUMN_HEIGHT = 24
export const HEADER_HEIGHT = 32
export const PADDING = 8
export const FOREIGN_KEY_LINE_WIDTH = 2
export const TABLE_SPACING = 100
export const ROW_SPACING = 100

/**
 * Calculate the height of a table box based on number of columns
 */
export function calculateTableHeight(table: DatabaseTable): number {
  const columnCount = table.columns?.length || 0
  return HEADER_HEIGHT + columnCount * COLUMN_HEIGHT + PADDING * 2
}

/**
 * Truncate text with ellipsis if too long
 */
export function truncateText(text: string, maxWidth: number): string {
  const avgCharWidth = 7
  const maxChars = Math.floor(maxWidth / avgCharWidth)

  if (text.length <= maxChars) {
    return text
  }

  return text.substring(0, maxChars - 3) + '...'
}

/**
 * Get connection point for a foreign key relationship
 */
export function getConnectionPoint(
  table: TableBox,
  columnName: string,
  side: 'left' | 'right'
): { x: number; y: number } {
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
 * Draw foreign key relationship lines
 */
export function drawForeignKeyLines(
  ctx: CanvasRenderingContext2D,
  tables: TableBox[],
  getConnectionPointFn: typeof getConnectionPoint
): void {
  ctx.strokeStyle = '#6366f1'
  ctx.lineWidth = FOREIGN_KEY_LINE_WIDTH

  tables.forEach((table) => {
    table.foreignKeys.forEach((fk) => {
      const targetTable = tables.find((t) => t.name === fk.foreign_table)
      if (!targetTable) return

      const sourcePoint = getConnectionPointFn(table, fk.column_name, 'right')
      const targetPoint = getConnectionPointFn(targetTable, fk.foreign_column, 'left')

      ctx.beginPath()
      ctx.moveTo(sourcePoint.x, sourcePoint.y)

      const controlOffset = 50
      ctx.bezierCurveTo(
        sourcePoint.x + controlOffset, sourcePoint.y,
        targetPoint.x - controlOffset, targetPoint.y,
        targetPoint.x, targetPoint.y
      )

      ctx.stroke()

      ctx.fillStyle = '#6366f1'
      ctx.beginPath()
      ctx.arc(sourcePoint.x, sourcePoint.y, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(targetPoint.x, targetPoint.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  })
}

/**
 * Draw a table box
 */
export function drawTable(
  ctx: CanvasRenderingContext2D,
  table: TableBox,
  draggingTable: string | null,
  truncateTextFn: typeof truncateText
): void {
  const { x, y, width, height, name, columns } = table

  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, width, height)

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  ctx.strokeStyle = draggingTable === name ? '#10b981' : '#e2e8f0'
  ctx.lineWidth = draggingTable === name ? 2 : 1
  ctx.strokeRect(x, y, width, height)

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(x, y, width, HEADER_HEIGHT)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y + HEADER_HEIGHT)
  ctx.lineTo(x + width, y + HEADER_HEIGHT)
  ctx.stroke()

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(truncateTextFn(name, width - PADDING * 2), x + PADDING, y + HEADER_HEIGHT / 2)

  ctx.font = '11px system-ui, -apple-system, sans-serif'
  columns.forEach((column, index) => {
    const columnY = y + HEADER_HEIGHT + PADDING + index * COLUMN_HEIGHT + COLUMN_HEIGHT / 2

    ctx.fillStyle = '#475569'
    ctx.textAlign = 'left'
    ctx.fillText(truncateTextFn(column.name, width - PADDING * 3), x + PADDING, columnY)

    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'right'
    ctx.fillText(truncateTextFn(column.data_type, 60), x + width - PADDING, columnY)
  })
}

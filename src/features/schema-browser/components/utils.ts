/**
 * Schema Browser Utilities
 * Helper functions for the Schema Browser component
 */

import { FileText, Hash, Key, LucideIcon } from 'lucide-react'

/**
 * Get color class for a data type
 */
export function getDataTypeColor(dataType: string): string {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
    return 'text-blue-600'
  }
  if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
    return 'text-green-600'
  }
  if (type.includes('bool')) {
    return 'text-purple-600'
  }
  if (type.includes('date') || type.includes('time')) {
    return 'text-orange-600'
  }
  if (type.includes('json') || type.includes('jsonb')) {
    return 'text-pink-600'
  }
  return 'text-slate-600'
}

/**
 * Get icon component for a data type
 */
export function getDataTypeIcon(dataType: string): LucideIcon {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
    return Hash
  }
  if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
    return FileText
  }
  return Key
}

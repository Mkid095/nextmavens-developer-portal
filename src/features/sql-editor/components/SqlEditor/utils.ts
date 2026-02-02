/**
 * SQL Editor Utilities
 */

import type { DESTRUCTIVE_COMMANDS } from './types'

export function extractSqlCommand(queryText: string): string {
  const trimmed = queryText.trim()
  const withoutComments = trimmed
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
  const match = withoutComments.match(/^(\w+)/)
  return match ? match[1].toUpperCase() : ''
}

export function isDestructiveQuery(queryText: string, destructiveCommands: readonly string[] = DESTRUCTIVE_COMMANDS): boolean {
  const command = extractSqlCommand(queryText)
  return destructiveCommands.includes(command)
}

/**
 * SQL Editor Query Operations
 */

import { addQueryToHistory } from './QueryHistory'
import { saveQuery } from './SavedQueries'
import { format } from 'sql-formatter'
import { extractSqlCommand } from './utils'

export interface QueryOperationsHandlers {
  query: string
  readonlyMode: boolean
  explainMode: boolean
  onExecute: (query: string, readonly: boolean, explain?: boolean) => void
  onChange: (value: string) => void
  setQuery: (value: string) => void
  editorRef: React.MutableRefObject<any>
}

export function createQueryHandlers(handlers: QueryOperationsHandlers) {
  const { query, readonlyMode, explainMode, onExecute, onChange, setQuery, editorRef } = handlers

  const handleExecute = () => {
    if (onExecute && query.trim()) {
      // US-005: Check if query is destructive and readonly mode is on
      if (readonlyMode && isDestructiveQuery(query)) {
        return { showWarning: true }
      }
      // US-004: Add query to history
      addQueryToHistory(query.trim(), readonlyMode)
      // US-008: Pass explain mode for query plan
      onExecute(query.trim(), readonlyMode, explainMode)
      return { showWarning: false }
    }
    return { showWarning: false }
  }

  const handleForceExecute = () => {
    if (onExecute && query.trim()) {
      // US-004: Add query to history
      addQueryToHistory(query.trim(), readonlyMode)
      // US-008: Pass explain mode for query plan
      onExecute(query.trim(), readonlyMode, explainMode)
    }
  }

  const handleExplain = () => {
    if (onExecute && query.trim()) {
      // US-004: Add query to history
      addQueryToHistory(query.trim(), readonlyMode)
      // Execute with explain mode enabled
      onExecute(query.trim(), readonlyMode, true)
    }
  }

  const handleFormat = () => {
    if (!query.trim()) {
      return
    }

    try {
      const formatted = format(query, {
        language: 'postgresql',
        tabWidth: 2,
        keywordCase: 'upper',
        identifierCase: 'lower',
        dataTypeCase: 'lower',
        functionCase: 'lower',
        indentStyle: 'standard',
        logicalOperatorNewline: 'before',
        expressionWidth: 60,
        linesBetweenQueries: 2,
        denseOperators: false,
        newlineBeforeSemicolon: true,
      })

      setQuery(formatted)
      if (onChange) {
        onChange(formatted)
      }

      // Update editor content
      if (editorRef.current) {
        const editor = editorRef.current
        editor.setValue(formatted)
      }
    } catch (error) {
      // If formatting fails (e.g., incomplete query), just keep the original
      console.warn('SQL formatting failed:', error)
    }
  }

  const loadQuery = (query: string) => {
    setQuery(query)
    if (onChange) {
      onChange(query)
    }
    // Focus the editor after loading
    if (editorRef.current) {
      editorRef.current.focus()
      editorRef.current.setPosition({ lineNumber: 1, column: 1 })
    }
  }

  const handleSaveQuery = () => {
    if (!query.trim()) {
      return
    }

    const name = prompt('Enter a name for this query:', extractSqlCommand(query) + ' Query')
    if (name === null) {
      // User cancelled
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      alert('Please enter a name for the query')
      return
    }

    try {
      saveQuery(query, trimmedName)
      // Optional: Show success feedback
      console.log('Query saved:', trimmedName)
    } catch (error) {
      console.error('Failed to save query:', error)
      alert('Failed to save query')
    }
  }

  return {
    handleExecute,
    handleForceExecute,
    handleExplain,
    handleFormat,
    loadQuery,
    handleSaveQuery,
  }
}

// Import the utility locally since we need it for handleExecute
function isDestructiveQuery(queryText: string): boolean {
  const DESTRUCTIVE_COMMANDS = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
    'TRUNCATE', 'CREATE', 'REPLACE', 'RENAME', 'GRANT', 'REVOKE', 'COMMENT'
  ]
  const command = extractSqlCommand(queryText)
  return DESTRUCTIVE_COMMANDS.includes(command)
}

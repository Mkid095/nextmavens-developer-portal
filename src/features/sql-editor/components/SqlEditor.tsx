'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, ShieldAlert } from 'lucide-react'

interface SqlEditorProps {
  value?: string
  onChange?: (value: string) => void
  onExecute?: (query: string, readonly: boolean) => void
  readOnly?: boolean
  placeholder?: string
  height?: string
  minHeight?: string
}

/**
 * SqlEditor Component
 *
 * Monaco-based SQL editor with syntax highlighting for Studio.
 *
 * Features:
 * - SQL syntax highlighting
 * - Line numbers
 * - Auto-indentation
 * - Query shortcut (Ctrl+Enter)
 * - Run query button
 * - Read-only mode (default)
 *
 * US-001: Create SQL Editor Component
 * US-005: Implement Read-Only Mode
 */
export function SqlEditor({
  value = '',
  onChange,
  onExecute,
  readOnly = false,
  placeholder = '-- Enter your SQL query here...\n-- Press Ctrl+Enter to execute',
  height = '400px',
  minHeight = '200px',
}: SqlEditorProps) {
  const editorRef = useRef<any>(null)
  const [query, setQuery] = useState(value)
  // US-005: Read-only mode state (checked by default for safety)
  const [readonlyMode, setReadonlyMode] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const handleEditorChange = (newValue: string | undefined) => {
    const updatedValue = newValue || ''
    setQuery(updatedValue)
    if (onChange) {
      onChange(updatedValue)
    }
  }

  /**
   * US-005: Destructive SQL commands check
   * Used to warn when trying to execute destructive queries in non-readonly mode
   */
  const DESTRUCTIVE_COMMANDS = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
    'TRUNCATE', 'CREATE', 'REPLACE', 'RENAME', 'GRANT', 'REVOKE', 'COMMENT'
  ]

  const extractSqlCommand = (queryText: string): string => {
    const trimmed = queryText.trim()
    const withoutComments = trimmed
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    const match = withoutComments.match(/^(\w+)/)
    return match ? match[1].toUpperCase() : ''
  }

  const isDestructiveQuery = (queryText: string): boolean => {
    const command = extractSqlCommand(queryText)
    return DESTRUCTIVE_COMMANDS.includes(command)
  }

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor

    // Add Ctrl+Enter shortcut to execute query
    editor.addCommand(
      window.monaco?.KeyMod.CtrlCmd | window.monaco?.KeyCode.Enter,
      () => {
        handleExecute()
      }
    )

    // Focus editor on mount
    editor.focus()
  }

  const handleExecute = () => {
    if (onExecute && query.trim()) {
      // US-005: Check if query is destructive and readonly mode is on
      if (readonlyMode && isDestructiveQuery(query)) {
        setShowWarning(true)
        return
      }
      // US-005: Pass readonly mode to execute handler
      onExecute(query.trim(), readonlyMode)
    }
  }

  const handleForceExecute = () => {
    setShowWarning(false)
    if (onExecute && query.trim()) {
      onExecute(query.trim(), readonlyMode)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              SQL Editor
            </span>
            <span className="text-xs text-slate-400">
              Press Ctrl+Enter to run
            </span>
          </div>
          {/* US-005: Read-only checkbox (checked by default) */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={readonlyMode}
              onChange={(e) => setReadonlyMode(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition">
              Read-only
            </span>
            {!readonlyMode && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                Write enabled
              </span>
            )}
          </label>
        </div>
        <button
          onClick={handleExecute}
          disabled={!query.trim() || readOnly}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Play className="w-4 h-4" />
          Run Query
        </button>
      </div>

      {/* US-005: Warning banner for destructive queries in read-only mode */}
      {showWarning && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Destructive Query Detected
            </p>
            <p className="text-xs text-amber-700 mt-1">
              This query contains a destructive command ({extractSqlCommand(query)}). To execute this query, you must uncheck <strong>Read-only</strong> mode above.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowWarning(false)}
                className="px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Editor
          height={height}
          defaultLanguage="sql"
          value={query}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80],
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            readOnly,
            domReadOnly: readOnly,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggest: {
              keywords: true,
              builtins: true,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500">
        <span>Lines: {editorRef.current?.getModel()?.getLineCount() || 0}</span>
        <span>Length: {query.length} characters</span>
      </div>
    </div>
  )
}

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
 * - RBAC permission enforcement (US-011)
 * - Query history integration (US-004)
 * - Query plan (EXPLAIN) button (US-008)
 * - SQL formatting button and shortcut (US-009)
 * - Save query button (US-010)
 *
 * US-001: Create SQL Editor Component
 * US-005: Implement Read-Only Mode
 * US-011: Enforce Studio Permissions
 * US-004: Implement Query History
 * US-008: Show Query Stats (EXPLAIN support)
 * US-009: Format SQL
 * US-010: Save Queries
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { SqlEditorProps, DESTRUCTIVE_COMMANDS } from './types'
import { canDisableReadonly } from './permissions'
import { createQueryHandlers } from './operations'
import { SqlEditorToolbar, DestructiveQueryWarning } from './toolbar'
import { getMonacoEditorProps, EDITOR_DEFAULTS } from './monaco'

export function SqlEditor({
  value = '',
  onChange,
  onExecute,
  onLoadQuery,
  readOnly = false,
  placeholder = EDITOR_DEFAULTS.placeholder,
  height = EDITOR_DEFAULTS.height,
  minHeight = EDITOR_DEFAULTS.minHeight,
  userRole = null,
}: SqlEditorProps) {
  const editorRef = useRef<any>(null)
  const [query, setQuery] = useState(value)
  // US-005: Read-only mode state (checked by default for safety)
  const [readonlyMode, setReadonlyMode] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  // US-008: Explain mode state for query plan analysis
  const [explainMode, setExplainMode] = useState(false)

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

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor

    // Add Ctrl+Enter shortcut to execute query
    editor.addCommand(
      (window.monaco?.KeyMod.CtrlCmd || 0) | (window.monaco?.KeyCode.Enter || 0),
      () => {
        handleExecute()
      }
    )

    // US-009: Add Ctrl+Shift+F shortcut to format SQL
    editor.addCommand(
      (window.monaco?.KeyMod.CtrlCmd || 0) | (window.monaco?.KeyMod.Shift || 0) | (window.monaco?.KeyCode.KEY_F || 0),
      () => {
        handleFormat()
      }
    )

    // Focus editor on mount
    editor.focus()
  }

  // Create query operation handlers
  const {
    handleExecute,
    handleForceExecute,
    handleExplain,
    handleFormat,
    loadQuery,
    handleSaveQuery,
  } = createQueryHandlers({
    query,
    readonlyMode,
    explainMode,
    onExecute: onExecute || (() => {}),
    onChange: onChange || (() => {}),
    setQuery,
    editorRef,
  })

  // Update handleExecute to set warning state
  const wrappedHandleExecute = () => {
    const result = handleExecute()
    if (result?.showWarning) {
      setShowWarning(true)
    }
  }

  // Expose loadQuery via onLoadQuery prop
  useEffect(() => {
    if (onLoadQuery) {
      // Store the loadQuery function for external access
      ;(window as any)._sqlEditorLoadQuery = loadQuery
    }
    return () => {
      delete (window as any)._sqlEditorLoadQuery
    }
  }, [loadQuery, onLoadQuery])

  const handleCancelWarning = () => {
    setShowWarning(false)
  }

  const handleForceExecute = () => {
    setShowWarning(false)
    if (onExecute && query.trim()) {
      // US-004: Add query to history
      import('./QueryHistory').then(({ addQueryToHistory }) => {
        addQueryToHistory(query.trim(), readonlyMode)
        // US-008: Pass explain mode for query plan
        onExecute(query.trim(), readonlyMode, explainMode)
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <SqlEditorToolbar
        query={query}
        readonlyMode={readonlyMode}
        userRole={userRole}
        setReadonlyMode={setReadonlyMode}
        canDisableReadonly={() => canDisableReadonly(userRole)}
        onExecute={wrappedHandleExecute}
        onFormat={handleFormat}
        onExplain={handleExplain}
        onSave={handleSaveQuery}
      />

      {/* US-005: Warning banner for destructive queries in read-only mode */}
      {showWarning && (
        <DestructiveQueryWarning
          query={query}
          onCancel={handleCancelWarning}
        />
      )}

      {/* Monaco Editor */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Editor
          {...getMonacoEditorProps(query, handleEditorChange, handleEditorMount, readOnly)}
          height={height}
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

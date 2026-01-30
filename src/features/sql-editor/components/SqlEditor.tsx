'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play } from 'lucide-react'

interface SqlEditorProps {
  value?: string
  onChange?: (value: string) => void
  onExecute?: (query: string) => void
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
 *
 * US-001: Create SQL Editor Component
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
      onExecute(query.trim())
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            SQL Editor
          </span>
          <span className="text-xs text-slate-400">
            Press Ctrl+Enter to run
          </span>
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

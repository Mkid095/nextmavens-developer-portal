/**
 * SQL Editor Monaco Editor Configuration
 */

import type { UserRole } from './types'
import { canDisableReadonly } from './permissions'

export const MONACO_OPTIONS = {
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
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },
}

export function getMonacoEditorProps(query: string, handleEditorChange: (value: string | undefined) => void, handleEditorMount: (editor: any) => void, readOnly: boolean) {
  return {
    height: '400px',
    defaultLanguage: 'sql' as const,
    value: query,
    onChange: handleEditorChange,
    onMount: handleEditorMount,
    theme: 'vs-light',
    options: {
      ...MONACO_OPTIONS,
      readOnly,
      domReadOnly: readOnly,
    },
    loading: (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
}

export const EDITOR_DEFAULTS = {
  height: '400px',
  minHeight: '200px',
  placeholder: '-- Enter your SQL query here...\n-- Press Ctrl+Enter to execute',
}

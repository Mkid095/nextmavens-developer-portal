'use client'

import { Edit2, Check, X } from 'lucide-react'
import type { MetadataEditorState } from '../types'

/**
 * UserMetadataEditor Component
 *
 * SECURITY NOTES:
 * - JSON content is displayed in a pre tag (React auto-escapes HTML, preventing XSS)
 * - Textarea input is validated for JSON format before saving
 * - Server-side validation via zod schema prevents malicious data structures
 * - Metadata is treated as untrusted input and properly escaped
 */
interface UserMetadataEditorProps {
  userMetadata: Record<string, unknown>
  metadataState: MetadataEditorState
  setMetadataState: (state: MetadataEditorState | ((prev: MetadataEditorState) => MetadataEditorState)) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
}

export function UserMetadataEditor({
  userMetadata,
  metadataState,
  setMetadataState,
  onStartEdit,
  onCancelEdit,
  onSave,
}: UserMetadataEditorProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">User Metadata</h2>
        {!metadataState.isEditing && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {metadataState.isEditing ? (
          <div>
            <textarea
              value={metadataState.editedMetadata}
              onChange={(e) => setMetadataState(prev => ({ ...prev, editedMetadata: e.target.value }))}
              className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-emerald-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {metadataState.jsonError && (
              <p className="mt-2 text-sm text-red-600">{metadataState.jsonError}</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-emerald-400">
              {JSON.stringify(userMetadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

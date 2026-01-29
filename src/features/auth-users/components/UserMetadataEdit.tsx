'use client'

import { useState } from 'react'
import { Edit2, Save, X, Loader2 } from 'lucide-react'
import type { EndUserDetailResponse } from '@/lib/types/auth-user.types'

interface UserMetadataEditProps {
  user: EndUserDetailResponse
  onMetadataUpdated: (metadata: Record<string, unknown>) => void
}

interface MetadataError {
  line: number
  message: string
}

export function UserMetadataEdit({ user, onMetadataUpdated }: UserMetadataEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [metadataText, setMetadataText] = useState(
    JSON.stringify(user.user_metadata, null, 2)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<MetadataError | null>(null)

  const handleEdit = () => {
    setIsEditing(true)
    setMetadataText(JSON.stringify(user.user_metadata, null, 2))
    setError(null)
    setParseError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setMetadataText(JSON.stringify(user.user_metadata, null, 2))
    setError(null)
    setParseError(null)
  }

  const validateJSON = (text: string): { valid: boolean; error?: MetadataError } => {
    try {
      JSON.parse(text)
      return { valid: true }
    } catch (err) {
      if (err instanceof SyntaxError) {
        const match = err.message.match(/position (\d+)/)
        const position = match ? parseInt(match[1], 10) : 0
        const lines = text.substring(0, position).split('\n')
        const line = lines.length
        return {
          valid: false,
          error: {
            line,
            message: err.message.replace(/at position \d+/, ''),
          },
        }
      }
      return {
        valid: false,
        error: { line: 1, message: 'Invalid JSON' },
      }
    }
  }

  const handleSave = async () => {
    setError(null)
    setParseError(null)

    const validation = validateJSON(metadataText)
    if (!validation.valid && validation.error) {
      setParseError(validation.error)
      return
    }

    let metadata: Record<string, unknown>
    try {
      metadata = JSON.parse(metadataText) as Record<string, unknown>
    } catch {
      setParseError({ line: 1, message: 'Invalid JSON' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/auth/users/${user.user_id}/metadata`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}`,
        }))
        throw new Error(errorData.message || 'Failed to update metadata')
      }

      const data = await response.json()
      onMetadataUpdated(metadata)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update metadata:', err)
      setError(err instanceof Error ? err.message : 'Failed to update metadata')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">User Metadata</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={metadataText}
              onChange={(e) => {
                setMetadataText(e.target.value)
                const validation = validateJSON(e.target.value)
                if (!validation.valid && validation.error) {
                  setParseError(validation.error)
                } else {
                  setParseError(null)
                }
              }}
              className="w-full h-64 p-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              spellCheck={false}
            />
            {parseError && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                Line {parseError.line}: {parseError.message}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading || !!parseError}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-lg transition"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <pre className="bg-slate-50 p-3 rounded-lg text-sm font-mono text-slate-800 overflow-x-auto">
          {JSON.stringify(user.user_metadata, null, 2)}
        </pre>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Loader2, Mail, Shield, Calendar, Clock, Edit2, Check, X, Key } from 'lucide-react'
import type {
  UserDetail as UserDetailData,
  MetadataEditorState,
} from './types'
import { UserHeader } from './components/UserHeader'
import { UserBasicInfo } from './components/UserBasicInfo'
import { UserAuthInfo } from './components/UserAuthInfo'
import { UserMetadataEditor } from './components/UserMetadataEditor'

interface UserDetailProps {
  userId: string
}

export function UserDetail({ userId }: UserDetailProps) {
  const [user, setUser] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metadataState, setMetadataState] = useState<MetadataEditorState>({
    isEditing: false,
    jsonError: null,
    editedMetadata: '',
  })

  useEffect(() => {
    fetchUserDetail()
  }, [userId])

  const fetchUserDetail = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication expired')
        }
        if (res.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to fetch user details')
      }

      const data = await res.json()
      setUser(data.user)
      setMetadataState({
        isEditing: false,
        jsonError: null,
        editedMetadata: JSON.stringify(data.user.user_metadata, null, 2),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user details'
      setError(message)
      console.error('Failed to fetch user details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditMetadata = () => {
    if (!user) return
    setMetadataState({
      isEditing: true,
      jsonError: null,
      editedMetadata: JSON.stringify(user.user_metadata, null, 2),
    })
  }

  const handleCancelEditMetadata = () => {
    if (!user) return
    setMetadataState({
      isEditing: false,
      jsonError: null,
      editedMetadata: JSON.stringify(user.user_metadata, null, 2),
    })
  }

  const handleSaveMetadata = async () => {
    if (!user) return

    try {
      const parsed = JSON.parse(metadataState.editedMetadata)
      setMetadataState(prev => ({ ...prev, jsonError: null }))

      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_metadata: parsed,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update user metadata')
      }

      const data = await res.json()
      setUser(data.user)
      setMetadataState({
        isEditing: false,
        jsonError: null,
        editedMetadata: JSON.stringify(data.user.user_metadata, null, 2),
      })
    } catch (err) {
      if (err instanceof SyntaxError) {
        setMetadataState(prev => ({
          ...prev,
          jsonError: 'Invalid JSON format',
        }))
      } else {
        const message = err instanceof Error ? err.message : 'Failed to save metadata'
        setMetadataState(prev => ({
          ...prev,
          jsonError: message,
        }))
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Error loading user</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchUserDetail}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="text-center">
          <p className="text-slate-500">User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">User Information</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserBasicInfo user={user} />
            <UserAuthInfo user={user} />
          </div>
        </div>
      </div>

      <UserMetadataEditor
        userMetadata={user.user_metadata}
        metadataState={metadataState}
        setMetadataState={setMetadataState}
        onStartEdit={handleStartEditMetadata}
        onCancelEdit={handleCancelEditMetadata}
        onSave={handleSaveMetadata}
      />
    </div>
  )
}

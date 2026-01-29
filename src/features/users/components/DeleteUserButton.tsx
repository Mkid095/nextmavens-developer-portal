'use client'

import { useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DeleteUserConfirmationModal } from './DeleteUserConfirmationModal'
import type { DeleteUserButtonProps, DeleteUserState } from '../types'

export function DeleteUserButton({
  userId,
  userEmail,
  userName,
  onDelete,
}: DeleteUserButtonProps) {
  const router = useRouter()
  const [state, setState] = useState<DeleteUserState>({
    isDeleting: false,
    showConfirmation: false,
    error: null,
  })

  const handleDeleteClick = useCallback(() => {
    setState({
      isDeleting: false,
      showConfirmation: true,
      error: null,
    })
  }, [])

  const handleCloseModal = useCallback(() => {
    setState({
      isDeleting: false,
      showConfirmation: false,
      error: null,
    })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    setState((prev) => ({ ...prev, isDeleting: true, error: null }))

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      // Call the callback if provided
      if (onDelete) {
        onDelete()
      } else {
        // Default behavior: navigate back to user list
        router.push('/studio/users')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      setState({
        isDeleting: false,
        showConfirmation: true,
        error: message,
      })
    }
  }, [userId, onDelete, router])

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={state.isDeleting}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete User</span>
      </button>

      <DeleteUserConfirmationModal
        isOpen={state.showConfirmation}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        userEmail={userEmail}
        userName={userName}
        isLoading={state.isDeleting}
      />
    </>
  )
}

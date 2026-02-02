'use client'

/**
 * Deletion Preview Modal - Main Component
 *
 * @deprecated This file has been refactored into a module structure.
 * Please use './DeletionPreviewModal-module' instead.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DeletionPreviewModalProps } from './types'
import { useDeletionPreview } from './hooks/use-deletion-preview'
import { ModalHeader, LoadingState, ErrorState, ResourceStats, Dependencies, RecoveryInfo, ModalFooter } from './components'

export default function DeletionPreviewModal({
  isOpen,
  onClose,
  projectId,
  onConfirmDelete,
}: DeletionPreviewModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { preview, loading, error: fetchError } = useDeletionPreview(isOpen, projectId)

  const handleDelete = async () => {
    if (!confirmed) {
      setError('Please confirm the deletion by checking the box')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await onConfirmDelete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete project')
      setDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <ModalHeader onClose={onClose} disabled={deleting} />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <LoadingState />
              ) : error || fetchError ? (
                <ErrorState error={error || fetchError || 'Unknown error'} />
              ) : preview ? (
                <div className="space-y-6">
                  <ResourceStats preview={preview} />
                  <Dependencies preview={preview} />
                  <RecoveryInfo preview={preview} />
                </div>
              ) : null}
            </div>

            <ModalFooter
              confirmed={confirmed}
              deleting={deleting}
              onClose={onClose}
              onConfirm={handleDelete}
              onConfirmedChange={setConfirmed}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

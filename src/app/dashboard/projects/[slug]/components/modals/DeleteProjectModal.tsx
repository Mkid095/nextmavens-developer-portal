import { X, AlertTriangle } from 'lucide-react'
import DeletionPreviewModal from '@/components/DeletionPreviewModal'
import type { Project } from '../../types'

interface DeleteProjectModalProps {
  isOpen: boolean
  isSubmitting: boolean
  project: Project
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteProjectModal({
  isOpen,
  isSubmitting,
  project,
  onClose,
  onConfirm,
}: DeleteProjectModalProps) {
  if (!isOpen) return null

  const handleDelete = async () => {
    await onConfirm()
  }

  return (
    <DeletionPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      projectId={project.id}
      onConfirmDelete={handleDelete}
    />
  )
}

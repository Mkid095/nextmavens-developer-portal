/**
 * Project Page Hook - Module - State Management
 */

import { useState } from 'react'
import type { ModalStates } from './types'
import { MODAL_INITIAL_STATES } from './constants'

export function useModalStates(): ModalStates {
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)
  const [keySubmitting, setKeySubmitting] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [rotateSubmitting, setRotateSubmitting] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeSubmitting, setRevokeSubmitting] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [newKey, setNewKey] = useState(null)
  const [showUsageExamples, setShowUsageExamples] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [supportStatusFilter, setSupportStatusFilter] = useState('all')
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  return {
    showCreateKeyModal,
    setShowCreateKeyModal,
    keySubmitting,
    setKeySubmitting,
    keyError,
    setKeyError,
    showRotateModal,
    setShowRotateModal,
    rotateSubmitting,
    setRotateSubmitting,
    showRevokeModal,
    setShowRevokeModal,
    revokeSubmitting,
    setRevokeSubmitting,
    selectedKeyId,
    setSelectedKeyId,
    newKey,
    setNewKey,
    showUsageExamples,
    setShowUsageExamples,
    showDeleteModal,
    setShowDeleteModal,
    deleteSubmitting,
    setDeleteSubmitting,
    showSupportModal,
    setShowSupportModal,
    selectedRequestId,
    setSelectedRequestId,
    showDetailModal,
    setShowDetailModal,
    supportStatusFilter,
    setSupportStatusFilter,
    setShowSecret,
  }
}

/**
 * Project Page Hook - Module - Modal Handlers
 */

import { useCallback } from 'react'
import type { CreateApiKeyData } from '../types'
import { createApiKey, rotateApiKey, revokeApiKey } from './api-key-handlers'

export function useModalHandlers(modalStates: any, fetchApiKeys: () => void) {
  const openCreateKeyModal = useCallback(() => {
    modalStates.setShowCreateKeyModal(true)
    modalStates.setKeyError('')
  }, [modalStates])

  const openRotateModal = useCallback((keyId: string) => {
    modalStates.setSelectedKeyId(keyId)
    modalStates.setShowRotateModal(true)
  }, [modalStates])

  const openRevokeModal = useCallback((keyId: string) => {
    modalStates.setSelectedKeyId(keyId)
    modalStates.setShowRevokeModal(true)
  }, [modalStates])

  const handleCreateApiKey = useCallback(async (data: CreateApiKeyData) => {
    await createApiKey(data, {
      onSuccess: (responseData) => {
        modalStates.setNewKey(responseData)
        modalStates.setShowUsageExamples(true)
        modalStates.setShowCreateKeyModal(false)
        fetchApiKeys()
      },
      onError: (error) => modalStates.setKeyError(error),
      onFinally: () => modalStates.setKeySubmitting(false),
    })
  }, [modalStates, fetchApiKeys])

  const handleRotateKey = useCallback(async () => {
    if (!modalStates.selectedKeyId) return

    await rotateApiKey(modalStates.selectedKeyId, {
      onSuccess: (newKey) => {
        modalStates.setNewKey(newKey)
        modalStates.setShowRotateModal(false)
        fetchApiKeys()
      },
      onError: (error) => alert(error),
      onFinally: () => modalStates.setRotateSubmitting(false),
    })
  }, [modalStates, fetchApiKeys])

  const handleRevokeKey = useCallback(async () => {
    if (!modalStates.selectedKeyId) return

    await revokeApiKey(modalStates.selectedKeyId, {
      onSuccess: () => {
        modalStates.setShowRevokeModal(false)
        fetchApiKeys()
      },
      onError: (error) => alert(error),
      onFinally: () => modalStates.setRevokeSubmitting(false),
    })
  }, [modalStates, fetchApiKeys])

  const handleViewRequestDetails = useCallback((requestId: string) => {
    modalStates.setSelectedRequestId(requestId)
    modalStates.setShowDetailModal(true)
  }, [modalStates])

  return {
    openCreateKeyModal,
    openRotateModal,
    openRevokeModal,
    handleCreateApiKey,
    handleRotateKey,
    handleRevokeKey,
    handleViewRequestDetails,
  }
}

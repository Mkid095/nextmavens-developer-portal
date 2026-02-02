/**
 * Dashboard Hooks - Module - Secret Modal Hook
 */

import { useState } from 'react'

export function useSecretModal() {
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [createdSecretKey, setCreatedSecretKey] = useState('')
  const [createdKeyName, setCreatedKeyName] = useState('')

  const showSecret = (secretKey: string, keyName: string) => {
    setCreatedSecretKey(secretKey)
    setCreatedKeyName(keyName)
    setShowSecretModal(true)
  }

  const hideSecret = () => {
    setShowSecretModal(false)
  }

  return {
    showSecretModal,
    createdSecretKey,
    createdKeyName,
    setShowSecretModal,
    setCreatedSecretKey,
    setCreatedKeyName,
    showSecret,
    hideSecret,
  }
}

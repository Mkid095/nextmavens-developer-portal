/**
 * useSecretFilters Hook
 * Handles search and filter state for secrets
 */

import { useState } from 'react'
import type { Secret } from '@/lib/types/secrets.types'

export interface FilterState {
  searchQuery: string
  filterActive: boolean | null
}

export interface FilterActions {
  setSearchQuery: (query: string) => void
  setFilterActive: (active: boolean | null) => void
}

export interface FilteredSecrets {
  secrets: Secret[]
  filters: FilterState
  filterActions: FilterActions
  filteredSecrets: Secret[]
}

export function useSecretFilters(initialSecrets: Secret[]): FilteredSecrets {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  const filteredSecrets = initialSecrets.filter((secret) => {
    const matchesSearch = secret.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === null || secret.active === filterActive
    return matchesSearch && matchesFilter
  })

  return {
    secrets: initialSecrets,
    filters: { searchQuery, filterActive },
    filterActions: { setSearchQuery, setFilterActive },
    filteredSecrets,
  }
}

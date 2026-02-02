/**
 * Feature Flag Cache
 */

import type { FeatureFlagScope } from './types'
import type { CacheEntry } from './types'

const flagCache = new Map<string, CacheEntry>()

export const CACHE_TTL = 60 * 1000 // 60 seconds

export function getCacheKey(name: string, scope: FeatureFlagScope, scopeId?: string): string {
  if (scope === 'global') {
    return `${name}:global`
  }
  return `${name}:${scope}:${scopeId}`
}

export function getCachedValue(name: string, scope: FeatureFlagScope, scopeId?: string): boolean | null {
  const key = getCacheKey(name, scope, scopeId)
  const entry = flagCache.get(key)

  if (entry && entry.expiresAt > Date.now()) {
    return entry.value
  }

  if (entry) {
    flagCache.delete(key)
  }

  return null
}

export function setCachedValue(name: string, scope: FeatureFlagScope, value: boolean, scopeId?: string): void {
  const key = getCacheKey(name, scope, scopeId)
  flagCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL,
  })
}

export function invalidateFlagCache(name?: string): void {
  if (name) {
    const keysToDelete: string[] = []
    for (const key of flagCache.keys()) {
      if (key.startsWith(`${name}:`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => flagCache.delete(key))
  } else {
    flagCache.clear()
  }
}

export function getCacheSize(): number {
  return flagCache.size
}

export function getCacheEntries(): Array<{ key: string; value: boolean; expiresAt: Date }> {
  return Array.from(flagCache.entries()).map(([key, entry]) => ({
    key,
    value: entry.value,
    expiresAt: new Date(entry.expiresAt),
  }))
}

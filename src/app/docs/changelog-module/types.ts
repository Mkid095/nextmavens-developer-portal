/**
 * Changelog - Type Definitions
 */

export type CategoryType = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed'

export type VersionStatus = 'current' | 'stable' | 'deprecated'

export interface PullRequest {
  number: number
  title: string
  url: string
}

export interface Issue {
  number: number
  title: string
  url: string
}

export interface ChangelogCategories {
  added?: string[]
  changed?: string[]
  deprecated?: string[]
  removed?: string[]
  fixed?: string[]
}

export interface ChangelogEntry {
  version: string
  releaseDate: string
  status: VersionStatus
  categories: ChangelogCategories
  pullRequests?: PullRequest[]
  issues?: Issue[]
}

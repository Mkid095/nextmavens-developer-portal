/**
 * Secrets Page Utilities
 */

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

export function formatGracePeriodEnd(dateString: string | null): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours <= 0) return 'Expired'
  if (diffHours < 1) return 'Less than 1 hour'
  if (diffHours < 24) return `${diffHours} hours`
  return `${Math.floor(diffHours / 24)} days`
}

export function filterSecrets(secrets: any[], searchQuery: string, filterActive: boolean | null): any[] {
  return secrets.filter((secret) => {
    const matchesSearch = secret.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === null || secret.active === filterActive
    return matchesSearch && matchesFilter
  })
}

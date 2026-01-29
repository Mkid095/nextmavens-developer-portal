/**
 * User Export Utilities
 * Functions for exporting user data to CSV format
 */

import type { EndUser } from '@/lib/types/auth-user.types'

/**
 * Convert user data to CSV format
 * Includes: email, name, created_at, last_sign_in_at, user_metadata
 */
export function usersToCSV(users: EndUser[]): string {
  // Define CSV headers
  const headers = [
    'Email',
    'Name',
    'Created At',
    'Last Sign In At',
    'Sign In Count',
    'Auth Provider',
    'Status',
    'User Metadata',
  ]

  // Convert users to CSV rows
  const rows = users.map((user) => {
    const metadata = JSON.stringify(user.user_metadata || {})

    return [
      escapeCSVField(user.email),
      escapeCSVField(user.name || ''),
      escapeCSVField(user.created_at),
      escapeCSVField(user.last_sign_in_at || ''),
      String(user.sign_in_count),
      escapeCSVField(user.auth_provider),
      escapeCSVField(user.status),
      escapeCSVField(metadata),
    ]
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Escape a field value for CSV format
 * Wraps in quotes if it contains commas, quotes, or newlines
 */
function escapeCSVField(value: string): string {
  if (!value) {
    return '""'
  }

  // Check if value needs quoting
  const needsQuoting =
    value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')

  if (!needsQuoting) {
    return value
  }

  // Escape quotes by doubling them and wrap in quotes
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Generate a filename for the CSV export
 * Format: users-export-YYYY-MM-DD.csv
 */
export function generateExportFilename(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `users-export-${year}-${month}-${day}.csv`
}

/**
 * Trigger a download of the CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export users to CSV and trigger download
 * Convenience function that combines all export steps
 */
export async function exportUsersToCSV(users: EndUser[]): Promise<void> {
  const csvContent = usersToCSV(users)
  const filename = generateExportFilename()
  downloadCSV(csvContent, filename)
}

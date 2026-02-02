/**
 * Changelog - Utility Functions
 */

import type { ChangelogEntry } from './types'

/**
 * Generate RSS feed from changelog data
 */
export function generateRSS(changelogData: ChangelogEntry[]): string {
  const rssItems = changelogData.map((entry) => {
    const categories = Object.entries(entry.categories)
      .filter(([_, items]) => items && items.length > 0)
      .map(([category, items]) => `${category.toUpperCase()}: ${items?.join(', ')}`)
      .join('\n')

    return `
    <item>
      <title>Version ${entry.version}</title>
      <link>https://nextmavens.cloud/docs/changelog#${entry.version.replace('.', '-')}</link>
      <description><![CDATA[
        <h3>Version ${entry.version}</h3>
        <p><strong>Released:</strong> ${entry.releaseDate}</p>
        <p><strong>Status:</strong> ${entry.status}</p>
        <pre>${categories}</pre>
      ]]></description>
      <pubDate>${new Date(entry.releaseDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">nextmavens-${entry.version}</guid>
    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NextMavens Changelog</title>
    <link>https://nextmavens.cloud/docs/changelog</link>
    <description>Latest updates and changes to the NextMavens platform</description>
    <language>en-us</language>
    <atom:link href="https://nextmavens.cloud/docs/changelog/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`
}

/**
 * Download RSS feed as a file
 */
export function downloadRSS(rss: string): void {
  const blob = new Blob([rss], { type: 'application/rss+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'changelog.rss'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Format release date for display
 */
export function formatReleaseDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get version ID for anchor links
 */
export function getVersionId(version: string): string {
  return version.replace('.', '-')
}

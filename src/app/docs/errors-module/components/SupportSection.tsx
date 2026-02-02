/**
 * Errors Documentation - Support Section Component
 */

import Link from 'next/link'

export function SupportSection() {
  return (
    <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
      <h3 className="font-semibold text-blue-900 mb-2">Need More Help?</h3>
      <p className="text-blue-800 mb-4">
        If you&apos;re encountering an error that&apos;s not covered here, or if the solutions don&apos;t
        resolve your issue, please contact our support team.
      </p>
      <Link
        href="/support"
        className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
      >
        Contact Support
      </Link>
    </div>
  )
}

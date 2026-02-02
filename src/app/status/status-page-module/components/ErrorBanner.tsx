/**
 * Status Page - Module - Error Banner Component
 */

import { motion } from 'framer-motion'

interface ErrorBannerProps {
  error: string | null
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <p className="text-red-700 dark:text-red-400">{error}</p>
    </motion.div>
  )
}

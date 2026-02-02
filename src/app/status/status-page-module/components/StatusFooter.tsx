/**
 * Status Page - Module - Status Footer Component
 */

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface StatusFooterProps {
  lastRefresh: Date
  onRefresh: () => void
}

export function StatusFooter({ lastRefresh, onRefresh }: StatusFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-4"
    >
      <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </button>
      <span>Auto-refreshes every 60 seconds</span>
    </motion.div>
  )
}

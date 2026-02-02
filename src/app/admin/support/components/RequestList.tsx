/**
 * Request List Component
 * Displays list of support requests as cards
 */

import { motion } from 'framer-motion'
import { User, FileText, Calendar } from 'lucide-react'
import type { SupportRequest } from '../types'
import { StatusBadge } from './StatusBadge'
import { VARIANTS } from '../constants'

interface RequestListProps {
  requests: SupportRequest[]
  onRequestClick: (request: SupportRequest) => void
}

export function RequestList({ requests, onRequestClick }: RequestListProps) {
  return (
    <motion.div
      variants={VARIANTS.container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {requests.map((request) => (
        <motion.div
          key={request.id}
          variants={VARIANTS.item}
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onRequestClick(request)}
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {request.subject}
                  </h3>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{request.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {request.user_name} ({request.user_email})
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {request.project_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(request.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

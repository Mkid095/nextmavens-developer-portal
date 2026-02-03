/**
 * Tool Input Schema Component
 */

import { useState } from 'react'

interface ToolInputSchemaProps {
  schema: any
}

export function ToolInputSchema({ schema }: ToolInputSchemaProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!schema || typeof schema !== 'object') {
    return <span className="text-xs text-slate-400 italic">No parameters</span>
  }

  const schemaString = JSON.stringify(schema, null, 2)

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium mb-2"
      >
        {isExpanded ? 'Hide schema' : 'Show schema'}
      </button>
      {isExpanded && (
        <pre className="text-xs bg-slate-800 text-green-400 p-3 rounded overflow-x-auto">
          {schemaString}
        </pre>
      )}
    </div>
  )
}

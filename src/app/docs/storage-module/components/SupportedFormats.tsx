/**
 * Storage Documentation - Supported Formats Component
 */

import { SUPPORTED_FORMATS } from '../constants'

export function SupportedFormats() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Supported File Formats</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {SUPPORTED_FORMATS.map((category) => (
          <div key={category.category} className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">{category.category}</h3>
            <div className="flex flex-wrap gap-2">
              {category.formats.map((format) => (
                <span
                  key={format}
                  className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

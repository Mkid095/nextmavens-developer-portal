/**
 * Modal Components - Module - Key Type Selector Component
 */

import type { KeyTypeSelectorProps } from '../types'
import { KEY_TYPE_CONFIG } from '../types'

export function KeyTypeSelector({ keyType, onKeyTypeChange }: KeyTypeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-3">Select Key Type</label>
      <div className="grid md:grid-cols-2 gap-3">
        {(Object.keys(KEY_TYPE_CONFIG) as Array<typeof keyType>).map((type) => {
          const typeConfig = KEY_TYPE_CONFIG[type]
          const IconComponent = typeConfig.icon
          const isSelected = keyType === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => onKeyTypeChange(type)}
              className={`p-4 rounded-xl border-2 text-left transition ${
                isSelected
                  ? `border-${typeConfig.color}-500 bg-${typeConfig.color}-50`
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    typeConfig.color === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : typeConfig.color === 'purple'
                      ? 'bg-purple-100 text-purple-700'
                      : typeConfig.color === 'red'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{typeConfig.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        typeConfig.riskLevel === 'Low'
                          ? 'bg-green-100 text-green-700'
                          : typeConfig.riskLevel === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : typeConfig.riskLevel === 'High'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {typeConfig.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{typeConfig.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {typeConfig.useCases.slice(0, 2).map((useCase) => (
                      <span key={useCase} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

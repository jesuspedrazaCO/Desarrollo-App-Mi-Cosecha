import { useState } from 'react'
import { formatCurrency } from '../../utils/formatCurrency'
import { updateMarketItem } from '../../services/marketService'
import Button from '../common/Button'

export default function MarketItemRow({ item, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle(item._id, !item.purchased)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className={`flex items-center gap-3 px-5 py-3 border-b border-stone-50 last:border-0 transition-all duration-200
      ${item.purchased ? 'opacity-60' : ''}`}>

      {/* Checkbox personalizado */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
          ${item.purchased
            ? 'bg-primary-600 border-primary-600 text-white'
            : 'border-stone-300 hover:border-primary-400'
          }`}
      >
        {item.purchased && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Nombre y detalles */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-stone-800 ${item.purchased ? 'line-through text-stone-400' : ''}`}>
          {item.name}
        </p>
        <p className="text-xs text-stone-400">
          {item.quantity} {item.unit}
          {item.estimatedPrice > 0 && ` · ${formatCurrency(item.estimatedPrice)} c/u`}
        </p>
      </div>

      {/* Subtotal */}
      {item.estimatedPrice > 0 && (
        <span className="text-sm font-bold text-accent-700 flex-shrink-0">
          {formatCurrency(item.quantity * item.estimatedPrice)}
        </span>
      )}

      {/* Acciones */}
      <div className="flex gap-1 flex-shrink-0">
        <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>✏️</Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(item)}>🗑️</Button>
      </div>
    </div>
  )
}

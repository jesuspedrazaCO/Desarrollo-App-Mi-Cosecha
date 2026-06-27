import { useState } from 'react'
import { formatCurrency } from '../../utils/formatCurrency'
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
    <div className={`flex items-center gap-3 px-5 py-3.5 border-b last:border-0 transition-all duration-200 ${
      item.purchased ? 'opacity-55' : ''
    }`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>

      {/* Checkbox circular */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          item.purchased
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-white/30 hover:border-emerald-400 bg-transparent'
        }`}
      >
        {toggling ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : item.purchased ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : null}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-white/90 ${item.purchased ? 'line-through text-white/40' : ''}`}>
          {item.name}
        </p>
        <p className="text-xs text-white/45">
          {item.quantity} {item.unit}
          {item.estimatedPrice > 0 && ` · ${formatCurrency(item.estimatedPrice)} c/u`}
        </p>
      </div>

      {/* Subtotal */}
      {item.estimatedPrice > 0 && (
        <span className={`text-sm font-bold flex-shrink-0 ${item.purchased ? 'text-emerald-400' : 'text-white/85'}`}>
          {formatCurrency(item.quantity * item.estimatedPrice)}
        </span>
      )}

      {/* Acciones */}
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(item)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all text-sm">
          ✏️
        </button>
        <button onClick={() => onDelete(item)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-400/15 transition-all text-sm">
          🗑️
        </button>
      </div>
    </div>
  )
}

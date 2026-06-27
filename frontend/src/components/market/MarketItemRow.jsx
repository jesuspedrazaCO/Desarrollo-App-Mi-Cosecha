import { useState } from 'react'
import { formatCurrency } from '../../utils/formatCurrency'

export default function MarketItemRow({ item, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    if (toggling) return
    setToggling(true)
    try {
      await onToggle(item._id, !item.purchased)
    } catch {
      // silencioso — el hook ya muestra toast
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 transition-all duration-200"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        opacity: item.purchased ? 0.55 : 1,
      }}
    >
      {/* Toggle comprado */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: item.purchased ? '#16a34a' : 'rgba(255,255,255,0.35)',
          background: item.purchased ? '#16a34a' : 'transparent',
          cursor: toggling ? 'wait' : 'pointer',
        }}
      >
        {toggling ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : item.purchased ? (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : null}
      </button>

      {/* Nombre y detalles */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90"
          style={{ textDecoration: item.purchased ? 'line-through' : 'none', color: item.purchased ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.90)' }}>
          {item.name}
        </p>
        <p className="text-xs text-white/45 mt-0.5">
          {item.quantity} {item.unit}
          {item.estimatedPrice > 0 && ` · ${formatCurrency(item.estimatedPrice)} c/u`}
        </p>
      </div>

      {/* Subtotal */}
      {item.estimatedPrice > 0 && (
        <span className="text-sm font-bold flex-shrink-0"
          style={{ color: item.purchased ? '#4ade80' : 'rgba(255,255,255,0.85)' }}>
          {formatCurrency(item.quantity * item.estimatedPrice)}
        </span>
      )}

      {/* Acciones */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.50)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.90)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
        >✏️</button>
        <button
          onClick={() => onDelete(item)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.50)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
        >🗑️</button>
      </div>
    </div>
  )
}

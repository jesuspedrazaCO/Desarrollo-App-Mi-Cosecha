import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function MarketListCard({ list, onEdit, onDelete }) {
  const pct = list.totalItems > 0
    ? Math.round((list.purchasedItems / list.totalItems) * 100)
    : 0

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5
      hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 ease-smooth">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-xl shadow-soft">
            🛒
          </div>
          <div>
            <h3 className="font-bold text-stone-900 font-display text-[15px]">{list.name}</h3>
            <p className="text-xs text-stone-400">{formatDate(list.date)}</p>
          </div>
        </div>
        <Badge color={list.status === 'completada' ? 'green' : 'amber'}>
          {list.status === 'completada' ? '✅ Completada' : '⏳ Pendiente'}
        </Badge>
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2 text-center">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Productos</p>
          <p className="text-lg font-bold text-stone-800 font-display">{list.totalItems}</p>
        </div>
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2 text-center">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Comprados</p>
          <p className="text-lg font-bold text-primary-700 font-display">{list.purchasedItems}</p>
        </div>
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2 text-center">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Est. total</p>
          <p className="text-sm font-bold text-accent-600">{formatCurrency(list.totalEstimated)}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      {list.totalItems > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>Progreso</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <Link to={`/market/${list._id}`} className="flex-1">
          <Button variant="secondary" className="w-full" size="sm">Ver lista</Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={() => onEdit(list)}>✏️</Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(list)}>🗑️</Button>
      </div>
    </div>
  )
}
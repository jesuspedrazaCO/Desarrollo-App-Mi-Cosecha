import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'
import { CROP_STATUS } from '../../utils/constants'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function CropCard({ crop, onEdit, onDelete }) {
  const status = CROP_STATUS[crop.status] || CROP_STATUS.activo
  const isProfit = crop.netProfit >= 0

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5
      hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 ease-smooth group">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-2xl shadow-soft">
            🌾
          </div>
          <div>
            <h3 className="font-bold text-stone-900 font-display text-[16px] leading-tight">{crop.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">{crop.type}</p>
          </div>
        </div>
        <Badge color={status.color}>{status.label}</Badge>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Inicio</p>
          <p className="text-sm font-semibold text-stone-700 mt-0.5">{formatDate(crop.startDate)}</p>
        </div>
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Cosecha est.</p>
          <p className="text-sm font-semibold text-stone-700 mt-0.5">
            {crop.estimatedHarvestDate ? formatDate(crop.estimatedHarvestDate) : '—'}
          </p>
        </div>
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Invertido</p>
          <p className="text-sm font-semibold text-accent-700 mt-0.5">{formatCurrencyCompact(crop.totalInvested)}</p>
        </div>
        <div className="bg-stone-50/70 rounded-2xl px-3 py-2">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Vendido</p>
          <p className="text-sm font-semibold text-primary-700 mt-0.5">{formatCurrencyCompact(crop.totalSold)}</p>
        </div>
      </div>

      {/* Ganancia */}
      <div className={`rounded-2xl px-4 py-3 mb-4 ${isProfit ? 'bg-primary-50' : 'bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ganancia neta</span>
          <span className={`text-lg font-bold font-display ${isProfit ? 'text-primary-700' : 'text-red-600'}`}>
            {formatCurrency(crop.netProfit)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Link to={`/crops/${crop._id}`} className="flex-1">
          <Button variant="secondary" className="w-full" size="sm">Ver detalle</Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={() => onEdit(crop)}>✏️</Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(crop)}>🗑️</Button>
      </div>
    </div>
  )
}
